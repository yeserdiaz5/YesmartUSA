import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Query orders that contain this product and are shipped with tracking number
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        tracking_number,
        carrier,
        status,
        order_items!inner(product_id)
      `,
      )
      .eq("order_items.product_id", productId)
      .eq("status", "shipped")
      .not("tracking_number", "is", null)

    if (error) {
      console.error("[v0] Error fetching shipped orders:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (error: any) {
    console.error("[v0] Error in get-product-shipped-orders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
