"use server"

import { createClient } from "@/lib/supabase/server"

export async function diagnoseOrder(orderId: string) {
  const supabase = await createClient()

  // Get order info
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

  if (orderError) {
    console.log("[v0] Error fetching order:", orderError)
    return { success: false, error: orderError.message }
  }

  // Get order items with product info
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(
        id,
        title,
        seller_id,
        seller:seller_id(email)
      )
    `)
    .eq("order_id", orderId)

  if (itemsError) {
    console.log("[v0] Error fetching order items:", itemsError)
    return { success: false, error: itemsError.message }
  }

  // Get buyer info
  let buyerEmail = order.buyer_email
  if (order.buyer_id) {
    const { data: buyer } = await supabase.from("users").select("email").eq("id", order.buyer_id).single()

    if (buyer) {
      buyerEmail = buyer.email
    }
  }

  console.log("[v0] ===== DIAGNOSTIC RESULTS =====")
  console.log("[v0] Order ID:", orderId)
  console.log("[v0] Buyer Email:", buyerEmail)
  console.log("[v0] Buyer ID:", order.buyer_id)
  console.log("[v0] Order Status:", order.status)
  console.log("[v0] Total Amount:", order.total_amount)
  console.log("[v0] \n===== ORDER ITEMS =====")

  orderItems?.forEach((item, index) => {
    console.log(`[v0] \nItem ${index + 1}:`)
    console.log("[v0]   Product:", item.product?.title)
    console.log("[v0]   seller_id in order_items:", item.seller_id)
    console.log("[v0]   seller_id in products:", item.product?.seller_id)
    console.log("[v0]   Seller email:", item.product?.seller?.email)
    console.log("[v0]   Match:", item.seller_id === item.product?.seller_id ? "✓ CORRECT" : "✗ MISMATCH")
  })

  return {
    success: true,
    order,
    orderItems,
    buyerEmail,
  }
}
