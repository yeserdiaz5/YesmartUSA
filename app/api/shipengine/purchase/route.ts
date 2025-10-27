import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rateId, orderId } = body

    const response = await fetch(`https://api.shipengine.com/v1/labels/rates/${rateId}`, {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        validate_address: "no_validation",
        label_format: "pdf",
        label_layout: "4x6",
      }),
    })

    const data = await response.json()

    // Optionally save to database
    if (orderId && data.label_id) {
      // Save label info to order
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error purchasing label:", error)
    return NextResponse.json({ error: "Failed to purchase label" }, { status: 500 })
  }
}
