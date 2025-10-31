import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { del } from "@vercel/blob"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting cleanup of labels older than 90 days...")

    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Find shipments older than 90 days with storage_path
    const { data: oldShipments, error: fetchError } = await supabase
      .from("shipments")
      .select("id, storage_path, label_url")
      .lt("created_at", ninetyDaysAgo.toISOString())
      .not("storage_path", "is", null)

    if (fetchError) {
      throw new Error(`Error fetching old shipments: ${fetchError.message}`)
    }

    if (!oldShipments || oldShipments.length === 0) {
      console.log("[v0] No old labels to cleanup")
      return NextResponse.json({ success: true, deleted: 0 })
    }

    console.log(`[v0] Found ${oldShipments.length} old labels to cleanup`)

    let deletedCount = 0
    const errors: string[] = []

    // Delete each label from Vercel Blob
    for (const shipment of oldShipments) {
      try {
        if (shipment.label_url) {
          await del(shipment.label_url)
          console.log(`[v0] Deleted label: ${shipment.storage_path}`)
          deletedCount++

          // Clear the storage_path and label_url in database
          await supabase.from("shipments").update({ storage_path: null, label_url: null }).eq("id", shipment.id)
        }
      } catch (error: any) {
        console.error(`[v0] Error deleting label ${shipment.storage_path}:`, error)
        errors.push(`${shipment.storage_path}: ${error.message}`)
      }
    }

    console.log(`[v0] Cleanup complete. Deleted ${deletedCount} labels`)

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("[v0] Error in cleanup job:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error during cleanup",
      },
      { status: 500 },
    )
  }
}
