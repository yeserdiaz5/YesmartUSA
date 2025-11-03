"use client"

import { useState, useEffect } from "react"
import { getBuyerLocation, type GeoLocation } from "@/lib/geolocation"

export function useBuyerLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchLocation() {
      try {
        setLoading(true)
        const buyerLocation = await getBuyerLocation()

        if (isMounted) {
          if (buyerLocation) {
            setLocation(buyerLocation)
            setError(null)
          } else {
            setError("Unable to determine location")
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to get location")
          console.error("Location error:", err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLocation()

    return () => {
      isMounted = false
    }
  }, [])

  return { location, loading, error }
}
