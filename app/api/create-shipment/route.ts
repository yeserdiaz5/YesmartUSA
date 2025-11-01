import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { put } from "@vercel/blob"
import { sendOrderEmail, customerShippedTemplate, sellerLabelCreatedTemplate } from "@/lib/email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rate_id, to_address, from_address, parcel, order_id, seller_email, buyer_id } = body

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
      addRandomSuffix: true,
    })
    console.log("[v0] PDF uploaded to Vercel Blob:", blob.url)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    const shipmentToSave = {
      order_id: order_id,
      user_id: buyer_id,
      tracking_number: shipmentData.tracking_number,
      carrier: shipmentData.provider,
      status: "label_created",
      label_url: shipmentData.label_url,
      label_storage_url: blob.url,
      tracking_url: shipmentData.tracking_url_provider,
      storage_path: filename,
      expires_at: expiresAt.toISOString(),
    }

    console.log("[v0] Saving shipment to database...")
    const { data: savedShipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert(shipmentToSave)
      .select()
      .single()

    if (shipmentError) {
      console.error("[v0] Error saving shipment:", shipmentError)
      throw new Error("Failed to save shipment to database")
    }

    console.log("[v0] Shipment saved successfully:", savedShipment)

    console.log("[v0] Updating order status to shipped...")
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        tracking_number: shipmentData.tracking_number,
        shipping_carrier: shipmentData.provider,
        status: "shipped",
      })
      .eq("id", order_id)

    if (orderUpdateError) {
      console.error("[v0] Error updating order:", orderUpdateError)
    }

    if (to_address.email) {
      try {
        const customerEmailData = {
          customerName: to_address.name,
          orderNumber: order_id.slice(0, 8),
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.provider,
          labelUrl: blob.url,
        }

        console.log("[v0] Sending shipped notification to customer:", to_address.email)
        await sendOrderEmail(
          to_address.email,
          "Your YesMart USA order has been shipped 🚚",
          customerShippedTemplate(customerEmailData),
        )
      } catch (emailError) {
        console.error("[v0] Error sending customer email (non-fatal):", emailError)
      }
    }

    if (seller_email) {
      try {
        const sellerEmailData = {
          orderNumber: order_id.slice(0, 8),
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.provider,
          labelUrl: blob.url,
        }

        console.log("[v0] Sending label created email to seller:", seller_email)
        await sendOrderEmail(seller_email, "Etiqueta creada", sellerLabelCreatedTemplate(sellerEmailData))
      } catch (emailError) {
        console.error("[v0] Error sending seller email (non-fatal):", emailError)
      }
    }

    try {
      const supportEmailData = {
        orderNumber: order_id.slice(0, 8),
        trackingNumber: shipmentData.tracking_number,
        trackingUrl: shipmentData.tracking_url_provider,
        carrier: shipmentData.provider,
        labelUrl: blob.url,
        customerName: to_address.name,
        customerEmail: to_address.email,
      }

      console.log("[v0] Sending tracking details to support@yesmartusa.com")
      await sendOrderEmail(
        "support@yesmartusa.com",
        `Order #${order_id.slice(0, 8)} Shipped`,
        `
        <h2>Order Shipped Notification</h2>
        <p><strong>Order:</strong> #${order_id.slice(0, 8)}</p>
        <p><strong>Customer:</strong> ${to_address.name} (${to_address.email})</p>
        <p><strong>Carrier:</strong> ${shipmentData.provider}</p>
        <p><strong>Tracking Number:</strong> ${shipmentData.tracking_number}</p>
        <p><strong>Tracking URL:</strong> <a href="${shipmentData.tracking_url_provider}">${shipmentData.tracking_url_provider}</a></p>
        <p><strong>Label URL:</strong> <a href="${blob.url}">Download Label</a></p>
      `,
      )
    } catch (emailError) {
      console.error("[v0] Error sending support email (non-fatal):", emailError)
    }

    const responseData = {
      tracking_number: shipmentData.tracking_number,
      tracking_url_provider: shipmentData.tracking_url_provider,
      label_url: blob.url, // Return Vercel Blob URL for permanent access
      carrier: shipmentData.provider,
      label_storage_url: blob.url,
      storage_path: filename,
    }

    console.log("[v0] Returning complete response:", responseData)

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
