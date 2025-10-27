import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipFrom, shipTo, weight, dimensions } = body

    const response = await fetch("https://api.shipengine.com/v1/rates", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate_options: {
          carrier_ids: [],
        },
        shipment: {
          ship_from: shipFrom,
          ship_to: shipTo,
          packages: [
            {
              weight,
              dimensions,
            },
          ],
        },
      }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting rates:", error)
    return NextResponse.json({ error: "Failed to get rates" }, { status: 500 })
  }
}
