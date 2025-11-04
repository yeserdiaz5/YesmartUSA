/**
 * Geolocation utilities for calculating delivery times based on user location
 */

/**
 * Get the current position of the user using the browser's Geolocation API
 * @param timeoutMs - Maximum time to wait for location (default: 8000ms)
 * @returns Promise with latitude and longitude coordinates
 * @throws Error if geolocation is not supported, denied, or times out
 */
export async function getCurrentPosition(timeoutMs = 8000): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("Geolocation request timed out"))
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 300000, // Cache position for 5 minutes
      },
    )
  })
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param a - First coordinate with latitude and longitude
 * @param b - Second coordinate with latitude and longitude
 * @returns Distance in kilometers
 */
export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371 // Earth's radius in kilometers
  const toRad = (degrees: number) => (degrees * Math.PI) / 180

  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const deltaLat = toRad(b.latitude - a.latitude)
  const deltaLon = toRad(b.longitude - a.longitude)

  const a1 = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + 
             Math.cos(lat1) * Math.cos(lat2) * 
             Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1))

  return R * c
}

/**
 * Convert distance to a human-readable delivery time estimate
 * @param distanceKm - Distance in kilometers
 * @returns Human-readable delivery time text
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
