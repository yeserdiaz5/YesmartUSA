import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to_address, from_address, parcel } = body

    // Validate required fields
    if (!to_address || !from_address || !parcel) {
      return NextResponse.json({ error: "Missing required fields: to_address, from_address, parcel" }, { status: 400 })
    }

    // Make request to Shippo API
    const response = await axios.post(
      "https://api.goshippo.com/transactions/",
      {
        address_to: to_address,
        address_from: from_address,
        parcel: parcel,
      },
      {
        headers: {
          Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error: any) {
    console.error("[v0] Error creating Shippo shipment:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data || error.message || "Error al crear envío",
      },
      { status: error.response?.status || 500 },
    )
  }
}
