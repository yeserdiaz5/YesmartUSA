"use client"

import { useState, useMemo } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SiteHeader from "@/components/site-header"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types/database"
import { getRatesForOrder } from "@/app/actions/shipengine-rates"
import { purchaseLabelForOrder } from "@/app/actions/shipengine"

interface CreateLabelPlusClientProps {
  user: User | null
  orderData: any
  sellerProfile: any
}

export default function CreateLabelPlusClient({ user, orderData, sellerProfile }: CreateLabelPlusClientProps) {
  const { toast } = useToast()

  const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState<"browse" | "select">("browse")
  const [packageType, setPackageType] = useState("custom")
  const [weightLbs, setWeightLbs] = useState("")
  const [weightOz, setWeightOz] = useState("")
  const [deliveryConfirmation, setDeliveryConfirmation] = useState(false)
  const [additionalHandling, setAdditionalHandling] = useState(false)
  const [insurance, setInsurance] = useState(false)
  const [showAllRates, setShowAllRates] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  // </CHANGE>

  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")

  const [gettingRates, setGettingRates] = useState(false)
  const [rates, setRates] = useState<any[]>([])
  const [purchasingRateId, setPurchasingRateId] = useState<string | null>(null)
  const [validatingAddress, setValidatingAddress] = useState(false)
  const [addressValidation, setAddressValidation] = useState<any>(null)

  const buyerAddress = orderData?.shipping_address
  const sellerAddress = sellerProfile?.seller_address

  const totalWeightOz = useMemo(() => {
    const lbs = Number.parseFloat(weightLbs) || 0
    const oz = Number.parseFloat(weightOz) || 0
    return lbs * 16 + oz
  }, [weightLbs, weightOz])

  const areDimensionsFilled = length.trim() !== "" && width.trim() !== "" && height.trim() !== "" && totalWeightOz > 0

  const handleGetRates = async () => {
    console.log("[v0] 🚀 Getting rates...")

    if (!orderData || !buyerAddress) {
      toast({
        title: "Error",
        description: "No se encontraron datos del pedido",
        variant: "destructive",
      })
      return
    }

    if (!sellerAddress) {
      toast({
        title: "Error",
        description: "No tienes una dirección de vendedor configurada",
        variant: "destructive",
      })
      return
    }

    if (!areDimensionsFilled) {
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

    if (lengthNum <= 0 || widthNum <= 0 || heightNum <= 0 || totalWeightOz <= 0) {
      toast({
        title: "Error",
        description: "Las dimensiones y el peso deben ser mayores a 0",
        variant: "destructive",
      })
      return
    }

    setGettingRates(true)
    setRates([])
    setActiveTab("select")

    try {
      const result = await getRatesForOrder(
        orderData.id,
        lengthNum,
        widthNum,
        heightNum,
        totalWeightOz,
        buyerAddress,
        sellerAddress,
        sellerAddress.full_name || sellerProfile?.business_name || "Seller",
        sellerAddress.phone,
      )

      if (result.success) {
        setRates(result.rates || [])
        toast({
          title: "Tarifas obtenidas",
          description: `Se encontraron ${result.rates?.length || 0} opciones de envío`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron obtener las tarifas",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al obtener las tarifas",
        variant: "destructive",
      })
    } finally {
      setGettingRates(false)
    }
  }

  const handlePurchaseLabel = async () => {
    if (!selectedRateId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una tarifa primero",
        variant: "destructive",
      })
      return
    }

    const selectedRate = rates.find((r) => r.rate_id === selectedRateId)
    if (!selectedRate) return

    const confirmed = confirm("⚠️ ADVERTENCIA: Esto comprará UNA etiqueta REAL y se te cobrará. ¿Continuar?")
    if (!confirmed) return

    setPurchasingRateId(selectedRateId)

    try {
      const lengthNum = Number.parseFloat(length)
      const widthNum = Number.parseFloat(width)
      const heightNum = Number.parseFloat(height)

      const result = await purchaseLabelForOrder(
        orderData.id,
        selectedRateId,
        selectedRate.service_code,
        lengthNum,
        widthNum,
        heightNum,
        totalWeightOz,
      )

      if (result.success && result.label) {
        toast({
          title: "¡Etiqueta Comprada!",
          description: `Tracking: ${result.label.tracking_number}`,
        })

        if (result.label.label_download?.pdf) {
          const link = document.createElement("a")
          link.href = result.label.label_download.pdf
          link.download = `shipping-label-${result.label.tracking_number}.pdf`
          link.target = "_blank"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo comprar la etiqueta",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al comprar la etiqueta",
        variant: "destructive",
      })
    } finally {
      setPurchasingRateId(null)
    }
  }

  const sortedRates = useMemo(() => {
    if (rates.length === 0) return []
    return [...rates].sort((a, b) => {
      const priceA = a.shipping_amount?.amount || 0
      const priceB = b.shipping_amount?.amount || 0
      return priceA - priceB
    })
  }, [rates])

  const displayedRates = showAllRates ? sortedRates : sortedRates.slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Ship Date */}
        <div className="mb-6">
          <Label className="text-gray-700 font-semibold mb-2 block">Ship Date</Label>
          <div className="relative">
            <Input
              type="date"
              value={shipDate}
              onChange={(e) => setShipDate(e.target.value)}
              className="w-full h-14 text-lg border-gray-300 rounded-lg"
            />
            <Calendar className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Ship From */}
        <div className="mb-6">
          <Label className="text-gray-700 font-semibold mb-2 block">Ship From</Label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-14 px-4 border border-gray-300 rounded-lg flex items-center justify-between bg-white">
              <span className="text-gray-900">{sellerAddress?.address_line1 || "No address configured"}</span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            <Button variant="ghost" className="text-blue-600 font-semibold">
              Edit
            </Button>
          </div>
        </div>

        {/* Ship To */}
        <div className="mb-8">
          <Label className="text-gray-700 font-semibold mb-2 block">Ship To</Label>
          <div className="flex items-start gap-3">
            <div className="flex-1 p-4 border border-gray-300 rounded-lg bg-white">
              <div className="text-gray-900 font-medium">{buyerAddress?.full_name}</div>
              <div className="text-gray-700">{buyerAddress?.address_line1}</div>
              {buyerAddress?.address_line2 && <div className="text-gray-700">{buyerAddress.address_line2}</div>}
              <div className="text-gray-700">
                {buyerAddress?.city}, {buyerAddress?.state} {buyerAddress?.postal_code}
              </div>
              <div className="text-gray-700">{buyerAddress?.country}</div>
              {addressValidation && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  VALIDATED
                  <ChevronDown className="w-3 h-3" />
                </div>
              )}
            </div>
            <Button variant="ghost" className="text-blue-600 font-semibold">
              Edit
            </Button>
          </div>
        </div>

        {/* Package Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Package Details</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "browse" ? "default" : "ghost"}
              onClick={() => setActiveTab("browse")}
              className={activeTab === "browse" ? "bg-gray-200 text-gray-900" : "text-gray-600"}
            >
              Browse Rates
            </Button>
            <Button
              variant={activeTab === "select" ? "default" : "ghost"}
              onClick={() => setActiveTab("select")}
              className={activeTab === "select" ? "bg-gray-200 text-gray-900" : "text-gray-600"}
            >
              Select Service
            </Button>
          </div>

          {activeTab === "browse" && (
            <div className="space-y-6">
              {/* Package Type */}
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Package Type</Label>
                <Select value={packageType} onValueChange={setPackageType}>
                  <SelectTrigger className="w-full h-14 text-lg border-gray-300 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="envelope">Envelope</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions */}
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Dimensions (in)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    placeholder="Length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="h-14 text-lg text-center border-gray-300 rounded-lg"
                    min="0.1"
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="Width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="h-14 text-lg text-center border-gray-300 rounded-lg"
                    min="0.1"
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="h-14 text-lg text-center border-gray-300 rounded-lg"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Weight</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(e.target.value)}
                      className="h-14 text-lg text-center border-gray-300 rounded-lg pr-12"
                      min="0"
                      step="1"
                    />
                    <span className="absolute right-4 top-4 text-gray-500">lbs</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={weightOz}
                      onChange={(e) => setWeightOz(e.target.value)}
                      className="h-14 text-lg text-center border-gray-300 rounded-lg pr-12"
                      min="0"
                      step="1"
                    />
                    <span className="absolute right-4 top-4 text-gray-500">oz</span>
                  </div>
                </div>
              </div>

              {/* Add-Ons */}
              <div>
                <Label className="text-gray-700 font-semibold mb-3 block">Add-Ons</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-700">Delivery Confirmation</span>
                    <Switch checked={deliveryConfirmation} onCheckedChange={setDeliveryConfirmation} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-700">This package requires additional handling</span>
                    <Switch checked={additionalHandling} onCheckedChange={setAdditionalHandling} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-700">Insurance</span>
                    <Switch checked={insurance} onCheckedChange={setInsurance} />
                  </div>
                </div>
              </div>

              {/* Calculate Rates Button */}
              <Button
                onClick={handleGetRates}
                disabled={gettingRates || !areDimensionsFilled}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg disabled:opacity-50"
              >
                {gettingRates ? "Calculating..." : "Calculate Rates"}
              </Button>
            </div>
          )}

          {activeTab === "select" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Shipping Service</h3>

              {sortedRates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No rates available. Click "Browse Rates" to calculate shipping options.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedRates.map((rate: any) => (
                    <div
                      key={rate.rate_id}
                      onClick={() => setSelectedRateId(rate.rate_id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRateId === rate.rate_id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Carrier Logo Placeholder */}
                        <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">
                            {rate.carrier_friendly_name?.substring(0, 4).toUpperCase()}
                          </span>
                        </div>

                        {/* Service Info */}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{rate.service_type}</div>
                          <div className="text-sm text-gray-600">
                            {rate.delivery_days ? `${rate.delivery_days} days` : "Standard delivery"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Paperless available
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${rate.shipping_amount?.amount?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedRates.length > 4 && !showAllRates && (
                    <button
                      onClick={() => setShowAllRates(true)}
                      className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline"
                    >
                      Show more rates <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Section */}
        {sortedRates.length > 0 && activeTab === "select" && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>

            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-700">Current Balance:</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">$17.17</span>
                <Button variant="ghost" className="text-blue-600 font-semibold">
                  ⊕ Add Funds
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 border-gray-300 text-gray-700 font-semibold bg-transparent"
                disabled={!selectedRateId}
              >
                Save Rate
              </Button>
              <Button
                onClick={handlePurchaseLabel}
                disabled={!selectedRateId || purchasingRateId !== null}
                className="flex-1 h-12 bg-gray-400 hover:bg-gray-500 text-white font-semibold disabled:opacity-50"
              >
                {purchasingRateId ? "Purchasing..." : "Purchase Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* </CHANGE> */}
    </div>
  )
}
