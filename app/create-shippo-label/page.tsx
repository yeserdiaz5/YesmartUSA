"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CreateShippoLabelPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")

  const [loading, setLoading] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{
    tracking_number: string
    tracking_url_provider: string
    label_url: string
  } | null>(null)

  // From Address (Seller)
  const [fromName, setFromName] = useState("")
  const [fromStreet1, setFromStreet1] = useState("")
  const [fromCity, setFromCity] = useState("")
  const [fromState, setFromState] = useState("")
  const [fromZip, setFromZip] = useState("")
  const [fromCountry, setFromCountry] = useState("US")
  const [fromPhone, setFromPhone] = useState("")
  const [fromEmail, setFromEmail] = useState("")

  // To Address (Buyer)
  const [toName, setToName] = useState("")
  const [toStreet1, setToStreet1] = useState("")
  const [toCity, setToCity] = useState("")
  const [toState, setToState] = useState("")
  const [toZip, setToZip] = useState("")
  const [toCountry, setToCountry] = useState("US")
  const [toPhone, setToPhone] = useState("")
  const [toEmail, setToEmail] = useState("")

  // Package Info
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")

  useEffect(() => {
    if (!orderId) return

    const loadOrderData = async () => {
      setLoadingOrder(true)
      setError("")

      try {
        const supabase = createClient()

        // Fetch order with buyer information
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*, order_items(*, products(*))")
          .eq("id", orderId)
          .single()

        if (orderError) throw orderError

        if (!order) {
          throw new Error("Order not found")
        }

        if (order.customer_name) setToName(order.customer_name)
        if (order.shipping_street) setToStreet1(order.shipping_street)
        if (order.shipping_city) setToCity(order.shipping_city)
        if (order.shipping_state) setToState(order.shipping_state)
        if (order.shipping_zip) setToZip(order.shipping_zip)
        if (order.shipping_country) setToCountry(order.shipping_country)
        if (order.customer_email) setToEmail(order.customer_email)

        if (order.order_items && order.order_items.length > 0) {
          const sellerId = order.order_items[0].seller_id

          const { data: seller, error: sellerError } = await supabase
            .from("users")
            .select("*")
            .eq("id", sellerId)
            .single()

          if (sellerError) throw sellerError

          if (seller) {
            if (seller.full_name) setFromName(seller.full_name)
            if (seller.email) setFromEmail(seller.email)
            if (seller.phone) setFromPhone(seller.phone)

            // Parse seller_address if it exists
            if (seller.seller_address) {
              const address = seller.seller_address as any
              if (address.street1) setFromStreet1(address.street1)
              if (address.city) setFromCity(address.city)
              if (address.state) setFromState(address.state)
              if (address.zip) setFromZip(address.zip)
              if (address.country) setFromCountry(address.country)
            }
          }

          const firstProduct = order.order_items[0].products
          if (firstProduct) {
            // Set some default dimensions (you can adjust these)
            setLength("12")
            setWidth("10")
            setHeight("8")
            setWeight("2")
          }
        }
      } catch (err) {
        console.error("[v0] Error loading order data:", err)
        setError(err instanceof Error ? err.message : "Error loading order data")
      } finally {
        setLoadingOrder(false)
      }
    }

    loadOrderData()
  }, [orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/create-shipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_address: {
            name: toName,
            street1: toStreet1,
            city: toCity,
            state: toState,
            zip: toZip,
            country: toCountry,
            phone: toPhone,
            email: toEmail,
          },
          from_address: {
            name: fromName,
            street1: fromStreet1,
            city: fromCity,
            state: fromState,
            zip: fromZip,
            country: fromCountry,
            phone: fromPhone,
            email: fromEmail,
          },
          parcel: {
            length,
            width,
            height,
            weight,
            distance_unit: "in",
            mass_unit: "lb",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error creando la etiqueta")
      }

      setResult({
        tracking_number: data.tracking_number,
        tracking_url_provider: data.tracking_url_provider,
        label_url: data.label_url,
      })

      // Open label in new tab
      if (data.label_url) {
        window.open(data.label_url, "_blank")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando la etiqueta, revisa los datos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Create Shipping Label
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate shipping labels with Shippo
          {orderId && <span className="ml-2 text-sm">(Order ID: {orderId})</span>}
        </p>
      </div>

      {loadingOrder && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading order data...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From Address */}
        <Card>
          <CardHeader>
            <CardTitle>From Address (Seller)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">Name</Label>
              <Input id="from-name" value={fromName} onChange={(e) => setFromName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">Email</Label>
              <Input
                id="from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="from-street1">Street Address</Label>
              <Input id="from-street1" value={fromStreet1} onChange={(e) => setFromStreet1(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-city">City</Label>
              <Input id="from-city" value={fromCity} onChange={(e) => setFromCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-state">State</Label>
              <Input
                id="from-state"
                value={fromState}
                onChange={(e) => setFromState(e.target.value)}
                placeholder="CA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-zip">ZIP Code</Label>
              <Input id="from-zip" value={fromZip} onChange={(e) => setFromZip(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-phone">Phone</Label>
              <Input
                id="from-phone"
                type="tel"
                value={fromPhone}
                onChange={(e) => setFromPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* To Address */}
        <Card>
          <CardHeader>
            <CardTitle>To Address (Buyer)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="to-name">Name</Label>
              <Input id="to-name" value={toName} onChange={(e) => setToName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-email">Email</Label>
              <Input id="to-email" type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="to-street1">Street Address</Label>
              <Input id="to-street1" value={toStreet1} onChange={(e) => setToStreet1(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-city">City</Label>
              <Input id="to-city" value={toCity} onChange={(e) => setToCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-state">State</Label>
              <Input
                id="to-state"
                value={toState}
                onChange={(e) => setToState(e.target.value)}
                placeholder="NY"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-zip">ZIP Code</Label>
              <Input id="to-zip" value={toZip} onChange={(e) => setToZip(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-phone">Phone</Label>
              <Input id="to-phone" type="tel" value={toPhone} onChange={(e) => setToPhone(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length (in)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width (in)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (in)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lb)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">Label Created Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Tracking Number:</p>
                <p className="text-lg font-mono">{result.tracking_number}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(result.tracking_url_provider, "_blank")}
                  className="flex items-center gap-2"
                >
                  Track Package
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => window.open(result.label_url, "_blank")}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  Download Label
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || loadingOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Label...
            </>
          ) : (
            "Create Label"
          )}
        </Button>
      </form>
    </div>
  )
}
