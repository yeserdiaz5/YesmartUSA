import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { createClient } from "@supabase/supabase-js"
import { sendOrderEmail, sellerLabelCreatedTemplate } from "@/lib/email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to_address, from_address, parcel, order_id, seller_email } = body

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
        metadata: order_id ? { order_id } : undefined,
      },
      {
        headers: {
          Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const shipmentData = response.data

    if (shipmentData.status === "SUCCESS" && seller_email) {
      try {
        const emailData = {
          orderNumber: order_id,
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.carrier,
          labelUrl: shipmentData.label_url,
        }

        console.log("[v0] Sending label created email to seller:", seller_email)
        const emailResult = await sendOrderEmail(seller_email, "Etiqueta creada", sellerLabelCreatedTemplate(emailData))
        console.log("[v0] Seller email result:", emailResult)
      } catch (emailError) {
        console.error("[v0] Error sending seller email (non-fatal):", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      data: shipmentData,
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
