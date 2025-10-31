"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, ExternalLink } from "lucide-react"

export default function CreateShippoLabelPage() {
  const [loading, setLoading] = useState(false)
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
        <p className="text-muted-foreground mt-2">Generate shipping labels with Shippo</p>
      </div>

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
          disabled={loading}
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
