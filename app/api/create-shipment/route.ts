import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { put } from "@vercel/blob"
import { sendOrderEmail, sellerLabelCreatedTemplate } from "@/lib/email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rate_id, to_address, from_address, parcel, order_id, seller_email } = body

    console.log("[v0] Creating shipment with data:", {
      rate_id,
      order_id,
      has_addresses: !!to_address && !!from_address,
      has_parcel: !!parcel,
    })

    if (!to_address || !from_address || !parcel) {
      return NextResponse.json({ error: "Missing required fields: to_address, from_address, parcel" }, { status: 400 })
    }

    let transactionBody: any

    if (rate_id) {
      transactionBody = {
        rate: rate_id,
        label_file_type: "PDF",
        async: false,
      }
    } else {
      transactionBody = {
        shipment: {
          address_from: from_address,
          address_to: to_address,
          parcels: [parcel],
        },
        carrier_account: undefined,
        servicelevel_token: "usps_priority",
      }
    }

    console.log("[v0] Calling Shippo transactions API...")

    const response = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionBody),
    })

    const shipmentData = await response.json()

    console.log("[v0] Shippo response status:", shipmentData.status)
    console.log("[v0] Shippo label_url:", shipmentData.label_url)

    if (!response.ok || shipmentData.status === "ERROR") {
      console.error("[v0] Shippo API error:", shipmentData)
      throw new Error(shipmentData.messages?.[0]?.text || "Error creating shipment")
    }

    if (!shipmentData.label_url) {
      console.error("[v0] WARNING: No label_url in Shippo response!")
      throw new Error("No label URL returned from Shippo")
    }

    console.log("[v0] Fetching PDF from Shippo...")
    const pdfResponse = await fetch(shipmentData.label_url)
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch PDF from Shippo")
    }
    const pdfBlob = await pdfResponse.blob()
    console.log("[v0] PDF fetched, size:", pdfBlob.size, "bytes")

    const filename = `labels/${order_id}.pdf`
    console.log("[v0] Uploading PDF to Vercel Blob:", filename)
    const blob = await put(filename, pdfBlob, {
      access: "public",
      contentType: "application/pdf",
    })
    console.log("[v0] PDF uploaded to Vercel Blob:", blob.url)

    const responseData = {
      ...shipmentData,
      label_storage_url: blob.url,
      storage_path: filename,
    }

    if (shipmentData.status === "SUCCESS" && seller_email) {
      try {
        const emailData = {
          orderNumber: order_id,
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.provider,
          labelUrl: blob.url, // Use the Vercel Blob URL instead of Shippo URL
        }

        console.log("[v0] Sending label created email to seller:", seller_email)
        await sendOrderEmail(seller_email, "Etiqueta creada", sellerLabelCreatedTemplate(emailData))
      } catch (emailError) {
        console.error("[v0] Error sending seller email (non-fatal):", emailError)
      }
    }

    console.log("[v0] Returning to frontend with storage URL:", blob.url)

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error: any) {
    console.error("[v0] Error creating Shippo shipment:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al crear envío",
      },
      { status: 500 },
    )
  }
}
