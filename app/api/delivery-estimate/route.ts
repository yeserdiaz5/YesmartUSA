import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  calculateDistance,
  calculateDeliveryTime,
  validateCoordinates,
  parseSellerCoordinates,
} from "@/lib/utils/deliveryEstimate"

export const dynamic = "force-dynamic"

/**
 * POST /api/delivery-estimate
 * Calculate delivery time estimation based on seller and buyer geolocation
 *
 * Body: {
 *   sellerId: string,
 *   lat: number,
 *   lng: number
 * }
 *
 * Response: {
 *   distance_km: number,
 *   estimated_minutes: number,
 *   method: 'geolocation'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sellerId, lat, lng } = body

    // Validate required fields
    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId is required" },
        { status: 400 }
      )
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Buyer coordinates (lat, lng) are required" },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (!validateCoordinates(lat, lng)) {
      return NextResponse.json(
        {
          error:
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch seller information from database
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("id, full_name, seller_address")
      .eq("id", sellerId)
      .eq("role", "seller")
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        {
          error: "Seller not found or not authorized",
          details: sellerError?.message,
        },
        { status: 404 }
      )
    }

    // Parse seller coordinates from seller_address
    const sellerCoords = parseSellerCoordinates(seller.seller_address)

    if (!sellerCoords) {
      return NextResponse.json(
        {
          error:
            "Seller location not available. The seller needs to configure their address with coordinates.",
          hint: "Seller address should include latitude and longitude fields",
        },
        { status: 400 }
      )
    }

    // Get configuration from environment variables
    const deliverySpeedKmh = parseInt(
      process.env.DELIVERY_SPEED_KMH || "40",
      10
    )
    const prepTimeMinutes = parseInt(
      process.env.PREP_TIME_MINUTES || "15",
      10
    )

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      sellerCoords.latitude,
      sellerCoords.longitude,
      lat,
      lng
    )

    // Calculate estimated delivery time
    const estimatedMinutes = calculateDeliveryTime(
      distance,
      deliverySpeedKmh,
      prepTimeMinutes
    )

    // Return response
    return NextResponse.json({
      distance_km: distance,
      estimated_minutes: estimatedMinutes,
      method: "geolocation",
      seller_name: seller.full_name,
    })
  } catch (error: any) {
    console.error("Error in delivery-estimate API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
