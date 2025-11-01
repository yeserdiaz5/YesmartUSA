import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const { tracking_number, carrier, order_id } = await request.json()

    if (!tracking_number || !carrier) {
      return NextResponse.json({ success: false, error: "Missing tracking number or carrier" }, { status: 400 })
    }

    const supabase = await createClient()

    if (order_id) {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("label_storage_url, label_url")
        .eq("order_id", order_id)
        .eq("tracking_number", tracking_number)
        .single()

      if (shipment?.label_storage_url) {
        console.log("[v0] Found existing label in Vercel Blob:", shipment.label_storage_url)
        return NextResponse.json({
          success: true,
          label_url: shipment.label_storage_url,
          source: "blob",
        })
      }
    }

    const shippoApiKey = process.env.SHIPPO_API_KEY

    if (!shippoApiKey) {
      return NextResponse.json({ success: false, error: "Shippo API key not configured" }, { status: 500 })
    }

    console.log("[v0] Fetching label from Shippo for tracking:", tracking_number)

    // Step 1: Get tracking info which includes the transaction ID
    const trackingResponse = await fetch("https://api.goshippo.com/tracks/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${shippoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        carrier: carrier.toLowerCase(),
        tracking_number: tracking_number,
      }),
    })

    if (!trackingResponse.ok) {
      console.error("[v0] Shippo tracking API error:", await trackingResponse.text())
      return NextResponse.json({ success: false, error: "Failed to get tracking info from Shippo" }, { status: 500 })
    }

    const trackingData = await trackingResponse.json()

    // Step 2: Get the transaction ID from tracking data
    const transactionId = trackingData.transaction

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "No transaction found for this tracking number" },
        { status: 404 },
      )
    }

    // Step 3: Get the transaction details which includes the label_url
    const transactionResponse = await fetch(`https://api.goshippo.com/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `ShippoToken ${shippoApiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!transactionResponse.ok) {
      console.error("[v0] Shippo transaction API error:", await transactionResponse.text())
      return NextResponse.json({ success: false, error: "Failed to get transaction from Shippo" }, { status: 500 })
    }

    const transactionData = await transactionResponse.json()
    const shippoLabelUrl = transactionData.label_url

    console.log("[v0] Downloading PDF from Shippo:", shippoLabelUrl)
    const pdfResponse = await fetch(shippoLabelUrl)
    if (!pdfResponse.ok) {
      console.error("[v0] Failed to download PDF from Shippo")
      return NextResponse.json({ success: true, label_url: shippoLabelUrl, source: "shippo" })
    }

    const pdfBlob = await pdfResponse.blob()
    const filename = `labels/${order_id || tracking_number}-${Date.now()}.pdf`

    console.log("[v0] Uploading PDF to Vercel Blob:", filename)
    const blob = await put(filename, pdfBlob, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: true,
    })

    console.log("[v0] PDF uploaded to Vercel Blob:", blob.url)

    if (order_id) {
      const { error: updateError } = await supabase.from("shipments").upsert(
        {
          order_id: order_id,
          tracking_number: tracking_number,
          carrier: carrier,
          label_url: shippoLabelUrl,
          label_storage_url: blob.url,
          storage_path: filename,
          status: "label_created",
        },
        {
          onConflict: "order_id,tracking_number",
        },
      )

      if (updateError) {
        console.error("[v0] Error saving label to database:", updateError)
      } else {
        console.log("[v0] Label saved to database successfully")
      }
    }

    return NextResponse.json({
      success: true,
      label_url: blob.url,
      source: "blob",
      tracking_url: transactionData.tracking_url_provider,
    })
  } catch (error) {
    console.error("[v0] Error in get-shippo-label:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
