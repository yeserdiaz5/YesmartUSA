"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

interface CheckoutData {
  customerName: string
  customerEmail: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country?: string
}

// Ahora el servidor acepta opcionalmente guestCartItems provenientes del cliente.
// No se llama a funciones que usan localStorage desde el servidor.
export async function createStripeCheckoutSession(
  checkoutData: CheckoutData,
  isGuest: boolean,
  guestCartItems?: Array<any>
) {
  const supabase = await createClient()

  let cartItems: any[] = []
  let userId: string | null = null

  if (!isGuest) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Debes iniciar sesión para proceder al pago")
    }

    userId = user.id

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(
          id,
          title,
          description,
          price,
          stock_quantity,
          seller_id,
          image_url
        )
      `)
      .eq("user_id", user.id)

    if (error || !data || data.length === 0) {
      throw new Error("El carrito está vacío")
    }

    cartItems = data.map((ci: any) => ({
      product: ci.product,
      quantity: ci.quantity,
    }))
  } else {
    // Para invitados, esperamos que el cliente envíe el carrito (guestCartItems).
    if (!guestCartItems || guestCartItems.length === 0) {
      throw new Error("El carrito está vacío")
    }

    cartItems = guestCartItems.map((it: any) => ({
      product: {
        id: it.id,
        title: it.title,
        description: it.description || "",
        price: it.price,
        image_url: it.image_url,
        seller_id: it.seller_id,
      },
      quantity: it.quantity ?? 1,
    }))
  }

  // Crear orden preliminar en BD con estado pending
  const totalAmount = cartItems.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0)

  let order: any = null
  try {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_email: isGuest ? checkoutData.customerEmail : null,
        status: "pending",
        total_amount: totalAmount,
        shipping_address: {
          name: checkoutData.customerName,
          phone: checkoutData.phone,
          street: checkoutData.street,
          city: checkoutData.city,
          state: checkoutData.state,
          zip: checkoutData.zip,
          country: checkoutData.country || "US",
        },
      })
      .select()
      .single()

    if (orderError || !orderData) {
      console.error("Error creating order:", orderError)
    } else {
      order = orderData

      // insertar items de orden
      try {
        const orderItems = cartItems.map((ci) => ({
          order_id: order.id,
          product_id: ci.product.id,
          seller_id: ci.product.seller_id,
          quantity: ci.quantity,
          price_at_purchase: ci.product.price,
        }))
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
        if (itemsError) {
          console.error("Error inserting order items:", itemsError)
        }
      } catch (err) {
        console.error("Error creating order items:", err)
      }
    }
  } catch (err) {
    console.error("Failed to create preliminary order:", err)
  }

  // Construir line items para Stripe
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((ci) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: ci.product.title,
        description: ci.product.description || undefined,
        images: ci.product.image_url ? [ci.product.image_url] : undefined,
      },
      unit_amount: Math.round(ci.product.price * 100),
    },
    quantity: ci.quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkoutplus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkoutplus`,
    metadata: {
      order_id: order?.id || "",
      buyer_id: userId ?? "",
      buyer_email: checkoutData.customerEmail ?? "",
    },
    customer_email: checkoutData.customerEmail,
  })

  return { url: session.url, sessionId: session.id, orderId: order?.id || null }
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session
}

export async function updateOrderStatusToPaid(orderId: string, paymentIntentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    throw new Error("Error al actualizar el estado de la orden: " + error.message)
  }

  return { success: true }
}