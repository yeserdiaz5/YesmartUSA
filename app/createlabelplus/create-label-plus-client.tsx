"use client"

import { useState, useMemo } from "react"
import { Package, MapPin, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SiteHeader from "@/components/site-header"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types/database"
import { getRatesForOrder, purchaseLabelForOrder } from "@/app/actions/shipengine"

interface CreateLabelPlusClientProps {
  user: User | null
  orderData: any
  sellerProfile: any
}

export default function CreateLabelPlusClient({ user, orderData, sellerProfile }: CreateLabelPlusClientProps) {
  const { toast } = useToast()

  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")

  const [gettingRates, setGettingRates] = useState(false)
  const [rates, setRates] = useState<any[]>([])
  const [purchasingRateId, setPurchasingRateId] = useState<string | null>(null)
  const [validatingAddress, setValidatingAddress] = useState(false)
  const [addressValidation, setAddressValidation] = useState<any>(null)

  const buyerAddress = orderData?.shipping_address
  const sellerAddress = sellerProfile?.seller_address

  const areDimensionsFilled =
    length.trim() !== "" && width.trim() !== "" && height.trim() !== "" && weight.trim() !== ""

  const handleValidateAndGetRates = async () => {
    console.log("[v0] 🔍 Validating addresses before getting rates...")
    setValidatingAddress(true)
    setAddressValidation(null)

    try {
      const { validateAddress } = await import("@/app/actions/shipengine")

      // Validate buyer address
      const buyerValidation = await validateAddress(buyerAddress)

      if (!buyerValidation.success || !buyerValidation.isValid) {
        setValidatingAddress(false)
        toast({
          title: "Dirección del comprador inválida",
          description: buyerValidation.messages?.[0]?.message || "La dirección del destinatario no pudo ser validada",
          variant: "destructive",
        })
        return
      }

      // Validate seller address
      const sellerValidation = await validateAddress(sellerAddress)

      if (!sellerValidation.success || !sellerValidation.isValid) {
        setValidatingAddress(false)
        toast({
          title: "Dirección del vendedor inválida",
          description: sellerValidation.messages?.[0]?.message || "Tu dirección de vendedor no pudo ser validada",
          variant: "destructive",
        })
        return
      }

      setAddressValidation({
        buyer: buyerValidation,
        seller: sellerValidation,
      })

      toast({
        title: "Direcciones validadas",
        description: "Ambas direcciones son válidas. Obteniendo tarifas...",
      })

      setValidatingAddress(false)

      // Proceed to get rates
      await handleGetRates()
    } catch (error: any) {
      console.error("[v0] ❌ Error validating addresses:", error)
      setValidatingAddress(false)
      toast({
        title: "Error",
        description: "Error al validar las direcciones",
        variant: "destructive",
      })
    }
  }

  const handleGetRates = async () => {
    console.log("[v0] 🚀 ===== GETTING RATES - START =====")
    console.log("[v0] Order Data:", orderData)
    console.log("[v0] Seller Profile:", sellerProfile)
    console.log("[v0] Buyer Address:", buyerAddress)
    console.log("[v0] Seller Address:", sellerAddress)
    console.log("[v0] Dimensions:", { length, width, height, weight })

    if (!orderData || !buyerAddress) {
      console.error("[v0] ❌ ERROR: No order data or buyer address")
      toast({
        title: "Error",
        description: "No se encontraron datos del pedido",
        variant: "destructive",
      })
      return
    }

    if (!sellerAddress) {
      console.error("[v0] ❌ ERROR: No seller address configured")
      toast({
        title: "Error",
        description:
          "No tienes una dirección de vendedor configurada. Por favor actualiza tu perfil en /seller/settings",
        variant: "destructive",
      })
      return
    }

    if (!sellerAddress.phone || sellerAddress.phone.trim() === "") {
      console.error("[v0] ❌ ERROR: Seller phone number missing")
      console.error("[v0] Seller address object:", sellerAddress)
      toast({
        title: "Error",
        description: "Falta el número de teléfono del vendedor. Por favor actualiza tu perfil en /seller/settings",
        variant: "destructive",
      })
      return
    }

    if (!length || !width || !height || !weight) {
      console.error("[v0] ❌ ERROR: Missing dimensions")
      toast({
        title: "Error",
        description: "Por favor completa todas las dimensiones y el peso",
        variant: "destructive",
      })
      return
    }

    const lengthNum = Number.parseFloat(length)
    const widthNum = Number.parseFloat(width)
    const heightNum = Number.parseFloat(height)
    const weightNum = Number.parseFloat(weight)

    if (lengthNum <= 0 || widthNum <= 0 || heightNum <= 0 || weightNum <= 0) {
      console.error("[v0] ❌ ERROR: Invalid dimensions (must be > 0)")
      toast({
        title: "Error",
        description: "Las dimensiones y el peso deben ser mayores a 0",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] ✅ All validations passed, calling getRatesForOrder...")
    setGettingRates(true)
    setRates([])

    try {
      const result = await getRatesForOrder(orderData.id, lengthNum, widthNum, heightNum, weightNum)

      console.log("[v0] 📦 getRatesForOrder result:", result)

      if (result.success) {
        console.log("[v0] ✅ SUCCESS: Rates retrieved:", result.rates?.length || 0)
        setRates(result.rates || [])
        toast({
          title: "Éxito!",
          description: result.message || `Se encontraron ${result.rates?.length || 0} tarifas`,
        })
      } else {
        console.error("[v0] ❌ ERROR: Failed to get rates")
        console.error("[v0] Error message:", result.error)
        console.error("[v0] Error details:", result.errorDetails)
        toast({
          title: "Error",
          description: result.error || "No se pudieron obtener las tarifas",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[v0] ❌ EXCEPTION in handleGetRates:", error)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
      toast({
        title: "Error",
        description: error.message || "Error al obtener las tarifas",
        variant: "destructive",
      })
    } finally {
      setGettingRates(false)
      console.log("[v0] 🏁 ===== GETTING RATES - END =====")
    }
  }

  const handlePurchaseLabel = async (rateId: string, serviceCode: string) => {
    console.log("[v0] 💳 ===== PURCHASING LABEL - START =====")
    console.log("[v0] Rate ID:", rateId)
    console.log("[v0] Service Code:", serviceCode)
    console.log("[v0] Order ID:", orderData?.id)
    console.log("[v0] Current purchasingRateId:", purchasingRateId)

    if (purchasingRateId) {
      console.warn("[v0] ⚠️ WARNING: Purchase already in progress for rate:", purchasingRateId)
      toast({
        title: "Espera",
        description: "Ya hay una compra en proceso. Por favor espera.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] 📋 Showing confirmation dialog...")
    const confirmed = confirm("⚠️ ADVERTENCIA: Esto comprará UNA etiqueta REAL y se te cobrará. ¿Continuar?")
    console.log("[v0] 📋 User confirmation:", confirmed ? "ACCEPTED" : "CANCELLED")

    if (!confirmed) {
      console.log("[v0] ℹ️ User cancelled purchase")
      return
    }

    console.log("[v0] ✅ User confirmed, proceeding with purchase...")
    setPurchasingRateId(rateId)

    try {
      const lengthNum = Number.parseFloat(length)
      const widthNum = Number.parseFloat(width)
      const heightNum = Number.parseFloat(height)
      const weightNum = Number.parseFloat(weight)

      console.log("[v0] 📦 Calling purchaseLabelForOrder with:", {
        orderId: orderData.id,
        rateId,
        serviceCode,
        dimensions: { lengthNum, widthNum, heightNum, weightNum },
      })

      const result = await purchaseLabelForOrder(
        orderData.id,
        rateId,
        serviceCode,
        lengthNum,
        widthNum,
        heightNum,
        weightNum,
      )

      console.log("[v0] 📦 purchaseLabelForOrder result:", result)
      console.log("[v0] 📦 Result success:", result.success)
      console.log("[v0] 📦 Result error:", result.error)
      console.log("[v0] 📦 Result label:", result.label)

      if (result.success && result.label) {
        console.log("[v0] ✅ SUCCESS: Label purchased!")
        console.log("[v0] Tracking number:", result.label.tracking_number)
        console.log("[v0] PDF URL:", result.label.label_download?.pdf)

        toast({
          title: "¡Etiqueta Comprada!",
          description: `Tracking: ${result.label.tracking_number}. Descargando PDF...`,
        })

        if (result.label.label_download?.pdf) {
          console.log("[v0] 📄 Downloading PDF...")
          try {
            // Create a temporary link and click it to download
            const link = document.createElement("a")
            link.href = result.label.label_download.pdf
            link.download = `shipping-label-${result.label.tracking_number}.pdf`
            link.target = "_blank"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            console.log("[v0] ✅ PDF download initiated")
          } catch (downloadError) {
            console.error("[v0] ❌ Error downloading PDF:", downloadError)
            // Fallback: try to open in new tab
            console.log("[v0] 📄 Fallback: Opening PDF in new tab...")
            window.open(result.label.label_download.pdf, "_blank")
          }
        } else {
          console.warn("[v0] ⚠️ No PDF URL in response")
        }
      } else {
        console.error("[v0] ❌ ERROR: Failed to purchase label")
        console.error("[v0] Error message:", result.error)
        console.error("[v0] Error details:", result.errorDetails)

        let errorMessage = result.error || "No se pudo comprar la etiqueta"

        // If there are error details, show them in a more readable format
        if (result.errorDetails) {
          console.error("[v0] Full error details:", JSON.stringify(result.errorDetails, null, 2))

          // Create a detailed error message
          const details = []
          if (result.errorDetails.authError) {
            details.push(`Auth Error: ${result.errorDetails.authError}`)
          }
          if (result.errorDetails.cookiesAvailable !== undefined) {
            details.push(`Cookies disponibles: ${result.errorDetails.cookiesAvailable}`)
          }
          if (result.errorDetails.authCookiesAvailable !== undefined) {
            details.push(`Auth cookies: ${result.errorDetails.authCookiesAvailable}`)
          }
          if (result.errorDetails.reason) {
            details.push(`Razón: ${result.errorDetails.reason}`)
          }

          if (details.length > 0) {
            errorMessage += "\n\n" + details.join("\n")
          }
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })

        // Also show an alert with the full error details for debugging
        if (result.errorDetails) {
          alert(`Error detallado:\n\n${errorMessage}\n\nRevisa la consola para más información.`)
        }
      }
    } catch (error: any) {
      console.error("[v0] ❌ EXCEPTION in handlePurchaseLabel:", error)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Full error object:", JSON.stringify(error, null, 2))

      toast({
        title: "Error",
        description: `Error inesperado: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      console.log("[v0] 🔓 Releasing purchase lock...")
      setPurchasingRateId(null)
      console.log("[v0] 🏁 ===== PURCHASING LABEL - END =====")
    }
  }

  const sortedRates = useMemo(() => {
    if (rates.length === 0) return []

    // Sort all rates by price (lowest first)
    return [...rates].sort((a, b) => {
      const priceA = a.shipping_amount?.amount || 0
      const priceB = b.shipping_amount?.amount || 0
      return priceA - priceB
    })
  }, [rates])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <SiteHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Crear Etiqueta de Envío</h1>
              <p className="text-gray-600">Flujo completo de ShipEngine para tu pedido</p>
            </div>
          </div>
        </div>

        {addressValidation && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Direcciones validadas correctamente</span>
              </div>
            </CardContent>
          </Card>
        )}

        {orderData && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">📋 Información del Pedido</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">📤 Remitente (Vendedor)</h4>
                  {sellerAddress ? (
                    <div className="text-sm">
                      <p className="font-medium">{sellerAddress.full_name}</p>
                      <p>{sellerAddress.address_line1}</p>
                      {sellerAddress.address_line2 && <p>{sellerAddress.address_line2}</p>}
                      <p>
                        {sellerAddress.city}, {sellerAddress.state} {sellerAddress.postal_code}
                      </p>
                      <p>{sellerAddress.country}</p>
                      {sellerAddress.phone && <p className="text-gray-600">Tel: {sellerAddress.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">⚠️ No tienes dirección configurada. Actualiza tu perfil.</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">📥 Destinatario (Comprador)</h4>
                  {buyerAddress ? (
                    <div className="text-sm">
                      <p className="font-medium">{buyerAddress.full_name}</p>
                      <p>{buyerAddress.address_line1}</p>
                      {buyerAddress.address_line2 && <p>{buyerAddress.address_line2}</p>}
                      <p>
                        {buyerAddress.city}, {buyerAddress.state} {buyerAddress.postal_code}
                      </p>
                      <p>{buyerAddress.country}</p>
                      <p className="text-gray-600">Tel: {buyerAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">⚠️ No hay dirección de envío</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Pedido ID:</strong> {orderData.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> ${orderData.total_amount}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">📦 Dimensiones del Paquete</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Largo (pulgadas)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width">Ancho (pulgadas)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Alto (pulgadas)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (onzas)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <Card className="bg-gradient-to-r from-green-500 to-blue-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="font-bold text-xl mb-2">Obtener Tarifas de Envío</h3>
                  <p className="text-green-50 text-sm">Validaremos las direcciones y obtendremos las mejores tarifas</p>
                </div>
                <Button
                  onClick={handleValidateAndGetRates}
                  disabled={gettingRates || validatingAddress || !orderData || !sellerAddress || !areDimensionsFilled}
                  className="bg-white text-green-700 hover:bg-green-50 px-8 py-6 text-lg font-semibold shadow-lg disabled:opacity-50"
                  size="lg"
                >
                  {validatingAddress ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : gettingRates ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Obteniendo...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      Obtener Tarifas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {sortedRates.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-xl">✅ Tarifas de Envío Disponibles</h3>
              <p className="text-sm text-gray-600 mb-4">
                Mostrando {sortedRates.length} opciones ordenadas por precio (menor a mayor)
              </p>
              <p className="text-sm text-orange-600 mb-4 p-3 bg-orange-50 rounded border border-orange-200">
                ⚠️ ADVERTENCIA: Comprar una etiqueta te cobrará dinero real. Solo se comprará UNA etiqueta por clic.
              </p>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {sortedRates.map((rate: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{rate.carrier_friendly_name}</div>
                      <div className="text-sm text-gray-600">{rate.service_type}</div>
                      {rate.delivery_days && (
                        <div className="text-xs text-gray-500 mt-1">{rate.delivery_days} días de entrega</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">Service Code: {rate.service_code}</div>
                    </div>
                    <div className="text-right mr-6">
                      <div className="font-bold text-2xl">${rate.shipping_amount?.amount?.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{rate.shipping_amount?.currency?.toUpperCase()}</div>
                    </div>
                    <Button
                      onClick={() => handlePurchaseLabel(rate.rate_id, rate.service_code)}
                      disabled={purchasingRateId !== null}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-6 py-3"
                      size="lg"
                    >
                      {purchasingRateId === rate.rate_id
                        ? "Comprando..."
                        : purchasingRateId
                          ? "Espera..."
                          : "Comprar Etiqueta"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {sortedRates.length === 0 && !gettingRates && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Ingresa las dimensiones del paquete y haz clic en "Obtener Tarifas".</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
