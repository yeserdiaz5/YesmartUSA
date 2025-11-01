import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tracking_number, carrier } = await request.json()

    if (!tracking_number || !carrier) {
      return NextResponse.json({ success: false, error: "Missing tracking number or carrier" }, { status: 400 })
    }

    const shippoApiKey = process.env.SHIPPO_API_KEY

    if (!shippoApiKey) {
      return NextResponse.json({ success: false, error: "Shippo API key not configured" }, { status: 500 })
    }

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
    console.log("[v0] Tracking data:", trackingData)

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
    console.log("[v0] Transaction data:", transactionData)

    return NextResponse.json({
      success: true,
      label_url: transactionData.label_url,
      tracking_url: transactionData.tracking_url_provider,
    })
  } catch (error) {
    console.error("[v0] Error in get-shippo-label:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
