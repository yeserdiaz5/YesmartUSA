"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import { Truck, ExternalLink, Printer, ArrowLeft, MapPin, UserIcon, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Shipment } from "@/app/actions/shipments"

interface OrderDetailsClientProps {
  user: User | null
  order: any
  shipments: Shipment[]
}

export default function OrderDetailsClient({ user, order, shipments }: OrderDetailsClientProps) {
  const router = useRouter()
  const firstShipment = shipments.length > 0 ? shipments[0] : null
  const hasLabel = order.status === "shipped" || (firstShipment && firstShipment.tracking_number)
  const labelUrl = firstShipment?.label_url || order.label_url

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "paid":
        return "Pagado"
      case "shipped":
        return "Enviado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push("/my-orders")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mis Compras
        </Button>

        <div className="space-y-6">
          {/* Order Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Detalles del Pedido</h1>
                  <p className="text-gray-600">Pedido #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold">Dirección de Envío</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <p>{order.shipping_address.full_name}</p>
                    </div>
                    <p className="ml-6">{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && (
                      <p className="ml-6">{order.shipping_address.address_line2}</p>
                    )}
                    <p className="ml-6">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </p>
                    <p className="ml-6">{order.shipping_address.country}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4" />
                      <p>{order.shipping_address.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Information */}
              {hasLabel && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Información de Envío</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Número de seguimiento:</span>
                      <span className="font-mono text-sm font-medium">
                        {firstShipment?.tracking_number || order.tracking_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transportista:</span>
                      <span className="text-sm font-medium">
                        {(firstShipment?.carrier || order.shipping_carrier || "").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {firstShipment?.tracking_url && (
                      <Button
                        onClick={() => window.open(firstShipment.tracking_url, "_blank")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Rastrear Envío
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (labelUrl) {
                          window.open(labelUrl, "_blank")
                        } else {
                          alert("La etiqueta de envío no está disponible.")
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={!labelUrl}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Ver Etiqueta
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Productos</h2>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.product?.image_url || "/placeholder.svg"}
                      alt={item.product?.title || "Product"}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-lg">{item.product?.title}</p>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Precio unitario: ${item.price_at_purchase}</p>
                    </div>
                    <p className="text-lg font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${order.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {order.status === "cancelled" && order.cancellation_reason && (
            <Card>
              <CardContent className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Pedido Cancelado</h3>
                  <p className="text-sm text-red-800">{order.cancellation_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
