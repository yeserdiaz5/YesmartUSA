"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Package, Truck } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

interface Rate {
  rate_id: string
  service_type: string
  service_code: string
  carrier_friendly_name: string
  carrier_code: string
  shipping_amount: {
    amount: number
    currency: string
  }
  delivery_days: number
  package_type: string
}

export default function CreateLabelClient({ user, order }: any) {
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Rate[]>([])
  const [selectedRate, setSelectedRate] = useState<string>("")
  const [purchasedLabel, setPurchasedLabel] = useState<any>(null)

  // Package details
  const [packageType, setPackageType] = useState("package")
  const [length, setLength] = useState("10")
  const [width, setWidth] = useState("8")
  const [height, setHeight] = useState("6")
  const [weightLbs, setWeightLbs] = useState("1")
  const [weightOz, setWeightOz] = useState("0")

  // Addresses
  const shipFrom = user?.seller_address || {
    name: "Your Store",
    address_line1: "1246 NE 40th TER",
    city_locality: "Miami",
    state_province: "FL",
    postal_code: "33334",
    country_code: "US",
  }

  const shipTo = order?.shipping_address || {
    name: "Customer Name",
    address_line1: "5540 WASHINGTON ST APT B308",
    city_locality: "Hollywood",
    state_province: "FL",
    postal_code: "33021",
    country_code: "US",
  }

  const getRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/shipengine/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipFrom,
          shipTo,
          weight: {
            value: Number.parseFloat(weightLbs) + Number.parseFloat(weightOz) / 16,
            unit: "pound",
          },
          dimensions: {
            length: Number.parseFloat(length),
            width: Number.parseFloat(width),
            height: Number.parseFloat(height),
            unit: "inch",
          },
        }),
      })

      const data = await response.json()
      if (data.rate_response?.rates) {
        setRates(data.rate_response.rates)
      }
    } catch (error) {
      console.error("Error getting rates:", error)
    } finally {
      setLoading(false)
    }
  }

  const purchaseLabel = async () => {
    if (!selectedRate) return

    setLoading(true)
    try {
      const response = await fetch("/api/shipengine/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate,
          orderId: order?.id,
        }),
      })

      const data = await response.json()
      if (data.label_download?.pdf) {
        setPurchasedLabel(data)
        // Open label in new tab
        window.open(data.label_download.pdf, "_blank")
      }
    } catch (error) {
      console.error("Error purchasing label:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Crear Etiqueta de Envío</h1>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Ship From */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enviar Desde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{shipFrom.name}</p>
              <p>{shipFrom.address_line1}</p>
              <p>
                {shipFrom.city_locality}, {shipFrom.state_province} {shipFrom.postal_code}
              </p>
              <p>{shipFrom.country_code}</p>
            </CardContent>
          </Card>

          {/* Ship To */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enviar A</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{shipTo.name}</p>
              <p>{shipTo.address_line1}</p>
              <p>
                {shipTo.city_locality}, {shipTo.state_province} {shipTo.postal_code}
              </p>
              <p>{shipTo.country_code}</p>
            </CardContent>
          </Card>
        </div>

        {/* Package Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles del Paquete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tipo de Paquete</Label>
                <Select value={packageType} onValueChange={setPackageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package">Paquete</SelectItem>
                    <SelectItem value="flat_rate_envelope">Sobre Tarifa Plana</SelectItem>
                    <SelectItem value="flat_rate_padded_envelope">Sobre Acolchado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Dimensiones (pulgadas)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input type="number" placeholder="Largo" value={length} onChange={(e) => setLength(e.target.value)} />
                <Input type="number" placeholder="Ancho" value={width} onChange={(e) => setWidth(e.target.value)} />
                <Input type="number" placeholder="Alto" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Peso</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Libras"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">lbs</p>
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Onzas"
                    value={weightOz}
                    onChange={(e) => setWeightOz(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">oz</p>
                </div>
              </div>
            </div>

            <Button onClick={getRates} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Calcular Tarifas"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Rates */}
        {rates.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Seleccionar Servicio de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.rate_id}
                  onClick={() => setSelectedRate(rate.rate_id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRate === rate.rate_id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{rate.service_type}</p>
                      <p className="text-sm text-gray-600">
                        {rate.carrier_friendly_name} • {rate.delivery_days} días
                      </p>
                    </div>
                    <p className="text-lg font-bold">${rate.shipping_amount.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <Button onClick={purchaseLabel} disabled={!selectedRate || loading} className="w-full mt-4" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comprando...
                  </>
                ) : (
                  "Comprar Etiqueta Ahora"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {purchasedLabel && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-800 font-medium">
                ¡Etiqueta comprada exitosamente! El PDF se abrió en una nueva pestaña.
              </p>
              <p className="text-sm text-green-700 mt-2">Tracking: {purchasedLabel.tracking_number}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
