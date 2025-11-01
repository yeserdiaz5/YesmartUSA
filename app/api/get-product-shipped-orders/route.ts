import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] get-product-shipped-orders called - fetching ALL shipped orders")

    const supabase = await createClient()

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        tracking_number,
        carrier,
        status,
        created_at,
        shipments(label_storage_url, label_url)
      `,
      )
      .eq("status", "shipped")
      .not("tracking_number", "is", null)
      .order("created_at", { ascending: false })

    console.log("[v0] Query result - orders:", orders)
    console.log("[v0] Query error:", error)

    if (error) {
      console.error("[v0] Error fetching shipped orders:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Returning", orders?.length || 0, "shipped orders")
    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (error: any) {
    console.error("[v0] Error in get-product-shipped-orders:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
