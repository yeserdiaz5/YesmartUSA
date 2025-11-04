/**
 * Delivery Estimate Utilities
 * Calculate distance and estimated delivery time based on geolocation
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Earth's radius in kilometers
  const R = 6371

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Distance in kilometers
  const distance = R * c

  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate estimated delivery time in minutes
 * @param distanceKm - Distance in kilometers
 * @param speedKmh - Average delivery speed in km/h (default: 40)
 * @param prepTimeMinutes - Preparation time in minutes (default: 15)
 * @returns Estimated time in minutes
 */
export function calculateDeliveryTime(
  distanceKm: number,
  speedKmh: number = 40,
  prepTimeMinutes: number = 15
): number {
  // Calculate travel time in minutes
  const travelTimeMinutes = (distanceKm / speedKmh) * 60

  // Total time = preparation time + travel time
  const totalMinutes = prepTimeMinutes + travelTimeMinutes

  return Math.round(totalMinutes)
}

/**
 * Validate latitude and longitude values
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Parse seller address to extract coordinates
 * This function looks for latitude and longitude in the seller_address JSONB
 * @param sellerAddress - Seller address object from database
 * @returns Coordinates object or null if not found
 */
export function parseSellerCoordinates(sellerAddress: any): {
  latitude: number
  longitude: number
} | null {
  if (!sellerAddress) return null

  // Try different possible field names
  const lat =
    sellerAddress.latitude ||
    sellerAddress.lat ||
    sellerAddress.geo_lat ||
    null
  const lng =
    sellerAddress.longitude ||
    sellerAddress.lng ||
    sellerAddress.lon ||
    sellerAddress.geo_lng ||
    null

  if (lat !== null && lng !== null && validateCoordinates(lat, lng)) {
    return { latitude: lat, longitude: lng }
  }

  return null
}
