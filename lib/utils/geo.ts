/**
 * Geolocation and distance calculation utilities for delivery time estimation
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Gets the current position of the user using the Geolocation API
 * @returns Promise resolving to user's coordinates
 * @throws Error if geolocation is not supported or permission is denied
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Check if running in secure context (HTTPS required for geolocation)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(new Error("Geolocation requires a secure context (HTTPS)"))
      return
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    // Request current position with timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false, // Don't need high accuracy for delivery estimation
      },
    )
  })
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function haversineDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude)
  const dLon = toRadians(coord2.longitude - coord1.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Estimates delivery time based on distance
 * @param distanceKm Distance in kilometers
 * @returns Human-readable delivery time estimate
 */
export function estimateDeliveryTimeText(distanceKm: number): string {
  if (distanceKm <= 5) {
    return "Entrega aprox. 30-60 min"
  } else if (distanceKm <= 20) {
    return "Entrega aprox. 60-120 min"
  } else {
    return "Entrega en 2-5 días"
  }
}

/**
 * Type guard to validate if an object is valid coordinates
 * @param location Object to validate
 * @returns True if location has valid latitude and longitude
 */
export function isValidCoordinates(location: any): location is Coordinates {
  return (
    location &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude)
  )
}
