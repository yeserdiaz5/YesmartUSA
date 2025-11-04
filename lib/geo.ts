/**
 * Geolocation and distance calculation utilities for delivery time estimation
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Get the current user's position using the browser's Geolocation API
 * @returns Promise with user's coordinates
 * @throws Error if geolocation is not available or user denies permission
 */
export async function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    const options = {
      timeout: 10000, // 10 seconds timeout
      enableHighAccuracy: false,
      maximumAge: 300000, // Cache position for 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        // Handle different error types
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("User denied geolocation permission"))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable"))
            break
          case error.TIMEOUT:
            reject(new Error("Location request timed out"))
            break
          default:
            reject(new Error("An unknown error occurred"))
        }
      },
      options,
    )
  })
}

/**
 * Calculate distance between two coordinates using the Haversine formula
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
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Estimate delivery time based on distance
 * @param distanceKm Distance in kilometers
 * @returns Human-readable delivery time estimate
 */
export function estimateDeliveryTime(distanceKm: number): string {
  if (distanceKm <= 5) {
    return "Entrega aprox. 30-60 min"
  } else if (distanceKm <= 20) {
    // For medium distances, calculate hours based on distance
    const minMinutes = Math.ceil(distanceKm * 3) // ~3 min per km
    const maxMinutes = Math.ceil(distanceKm * 6) // ~6 min per km
    
    if (maxMinutes < 60) {
      return `Entrega aprox. ${minMinutes}-${maxMinutes} min`
    } else {
      const minHours = Math.ceil(minMinutes / 60)
      const maxHours = Math.ceil(maxMinutes / 60)
      return `Entrega aprox. ${minHours}-${maxHours} horas`
    }
  } else {
    // For long distances, estimate in days
    const minDays = 2
    const maxDays = Math.min(5, Math.ceil(distanceKm / 100))
    return `Entrega en ${minDays}-${maxDays} días`
  }
}
