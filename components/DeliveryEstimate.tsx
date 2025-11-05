"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeliveryEstimateProps {
  sellerId: string
  className?: string
  compact?: boolean
}

interface EstimateData {
  distance_km: number
  estimated_minutes: number
  method: string
  seller_name?: string
}

type EstimateState =
  | { status: "idle" }
  | { status: "requesting-permission" }
  | { status: "loading" }
  | { status: "success"; data: EstimateData }
  | { status: "error"; message: string }
  | { status: "permission-denied" }

export function DeliveryEstimate({
  sellerId,
  className = "",
  compact = false,
}: DeliveryEstimateProps) {
  const [state, setState] = useState<EstimateState>({ status: "idle" })

  useEffect(() => {
    // Auto-request geolocation on mount if browser supports it
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      requestGeolocation()
    }
  }, [sellerId])

  const requestGeolocation = () => {
    setState({ status: "requesting-permission" })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await fetchEstimate(latitude, longitude)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState({ status: "permission-denied" })
        } else {
          setState({
            status: "error",
            message: "Unable to get your location. Please try again.",
          })
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  }

  const fetchEstimate = async (lat: number, lng: number) => {
    setState({ status: "loading" })

    try {
      const response = await fetch("/api/delivery-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId,
          lat,
          lng,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState({
          status: "error",
          message: data.error || "Failed to calculate delivery estimate",
        })
        return
      }

      setState({ status: "success", data })
    } catch (error) {
      setState({
        status: "error",
        message: "Network error. Please check your connection.",
      })
    }
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `~${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `~${hours}h`
    }
    return `~${hours}h ${remainingMinutes}min`
  }

  // Compact view for checkout
  if (compact && state.status === "success") {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Clock className="h-4 w-4" />
        <span>ETA: {formatTime(state.data.estimated_minutes)}</span>
        <span className="text-xs">({state.data.distance_km} km)</span>
      </div>
    )
  }

  // Loading states
  if (state.status === "idle" || state.status === "requesting-permission") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Requesting location permission...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.status === "loading") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm">Calculating delivery estimate...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (state.status === "success") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Estimated Delivery Time
                </h3>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatTime(state.data.estimated_minutes)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Distance: {state.data.distance_km} km</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on your current location and average delivery speed.
              Actual time may vary.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Permission denied state
  if (state.status === "permission-denied") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm mb-3">
                Location permission denied. Please enable location access to
                see delivery estimates.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestGeolocation}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (state.status === "error") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm mb-3">{state.message}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestGeolocation}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return null
}
