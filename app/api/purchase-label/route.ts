import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const orderId = formData.get("orderId") as string

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    }

    const { data: seller } = await supabaseAdmin.from("users").select("*").eq("id", order.seller_id).single()

    if (!seller) {
      return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
    }

    let totalWeight = 0
    for (const item of order.order_items) {
      const weight = item.products?.weight || 1
      totalWeight += weight * item.quantity
    }

    const shipEngineResponse = await fetch("https://api.shipengine.com/v1/labels", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipment: {
          service_code: "usps_priority_mail",
          ship_to: {
            name: order.customer_name,
            address_line1: order.shipping_address,
            city_locality: order.shipping_city || "Unknown",
            state_province: order.shipping_state || "FL",
            postal_code: order.shipping_zip || "33021",
            country_code: "US",
          },
          ship_from: {
            name: seller.full_name || "Seller",
            address_line1: seller.address || "123 Main St",
            city_locality: seller.city || "Miami",
            state_province: seller.state || "FL",
            postal_code: seller.zip || "33101",
            country_code: "US",
          },
          packages: [
            {
              weight: {
                value: totalWeight,
                unit: "ounce",
              },
            },
          ],
        },
      }),
    })

    const labelData = await shipEngineResponse.json()

    if (!shipEngineResponse.ok) {
      return NextResponse.json({ error: "Error al crear etiqueta", details: labelData }, { status: 500 })
    }

    const { error: insertError } = await supabaseAdmin.from("shipments").insert({
      order_id: orderId,
      tracking_number: labelData.tracking_number,
      label_url: labelData.label_download.pdf,
      carrier: "USPS",
      service: "Priority Mail",
      cost: labelData.shipment_cost.amount,
      status: "created",
    })

    if (insertError) {
      console.error("[v0] Error saving label:", insertError)
      return NextResponse.json({ error: "Error al guardar etiqueta" }, { status: 500 })
    }

    await supabaseAdmin.from("orders").update({ status: "shipped" }).eq("id", orderId)

    return NextResponse.redirect(new URL(`/orders?success=true`, request.url))
  } catch (error) {
    console.error("[v0] Purchase label error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
