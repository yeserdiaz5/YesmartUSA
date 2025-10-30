"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { purchaseLabelForOrder } from "@/app/actions/shipengine"
import { Loader2, Package } from "lucide-react"
import { useRouter } from "next/navigation"

type Order = {
  id: string
  customer_name: string
  shipping_street: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
}

export function ShippingLabelDialog({
  order,
  userId,
  isOpen,
  onClose,
}: {
  order: Order
  userId: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dimensiones del paquete
  const [length, setLength] = useState("12")
  const [width, setWidth] = useState("9")
  const [height, setHeight] = useState("6")
  const [weight, setWeight] = useState("16") // en onzas

  // Servicio de envío
  const [serviceCode, setServiceCode] = useState("usps_priority_mail")

  const handlePurchase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await purchaseLabelForOrder(
        order.id,
        "rate_placeholder", // En producción, primero obtienes rates y el usuario elige
        serviceCode,
        Number.parseFloat(length),
        Number.parseFloat(width),
        Number.parseFloat(height),
        Number.parseFloat(weight),
        userId,
      )

      if (result.success) {
        // Recargar la página para mostrar la nueva etiqueta
        router.refresh()
        onClose()
      } else {
        setError(result.error || "Error al comprar la etiqueta")
      }
    } catch (err: any) {
      console.error("[v0] Error purchasing label:", err)
      setError(err.message || "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comprar Etiqueta de Envío</DialogTitle>
          <DialogDescription>
            Orden #{order.id.slice(0, 8)} - {order.customer_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dirección de envío */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Dirección de Destino</h4>
            <p className="text-sm text-muted-foreground">
              {order.shipping_street}
              <br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>

          {/* Dimensiones del paquete */}
          <div className="space-y-4">
            <h4 className="font-medium">Dimensiones del Paquete</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Largo (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width">Ancho (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Alto (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="weight">Peso (oz)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="1"
                step="0.1"
              />
            </div>
          </div>

          {/* Servicio de envío */}
          <div>
            <Label htmlFor="service">Servicio de Envío</Label>
            <Select value={serviceCode} onValueChange={setServiceCode}>
              <SelectTrigger id="service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usps_priority_mail">USPS Priority Mail</SelectItem>
                <SelectItem value="usps_first_class_mail">USPS First Class Mail</SelectItem>
                <SelectItem value="ups_ground">UPS Ground</SelectItem>
                <SelectItem value="fedex_ground">FedEx Ground</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handlePurchase} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comprando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Comprar Etiqueta
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
