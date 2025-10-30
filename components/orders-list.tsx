"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShippingLabelDialog } from "@/components/shipping-label-dialog"
import { Package, Truck } from "lucide-react"

type Order = {
  id: string
  status: string
  total_amount: number
  customer_name: string
  customer_email: string
  shipping_street: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price_at_purchase: number
    product: {
      title: string
      image_url: string
    }
  }>
  shipments: Array<{
    id: string
    tracking_number: string
    carrier: string
    status: string
    label_url: string
    tracking_url: string
  }>
}

export function OrdersList({ orders, userId }: { orders: Order[]; userId: string }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      pending: { label: "Pendiente", variant: "secondary" },
      paid: { label: "Pagado", variant: "default" },
      processing: { label: "Procesando", variant: "default" },
      shipped: { label: "Enviado", variant: "outline" },
      delivered: { label: "Entregado", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    }

    const config = statusConfig[status] || { label: status, variant: "default" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handlePurchaseLabel = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay órdenes</h3>
        <p className="text-muted-foreground">Aún no tienes órdenes de venta.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const hasShipment = order.shipments && order.shipments.length > 0
          const shipment = hasShipment ? order.shipments[0] : null

          return (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">Orden #{order.id.slice(0, 8)}</h3>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p>
                      <strong>Cliente:</strong> {order.customer_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {order.customer_email}
                    </p>
                    <p>
                      <strong>Dirección:</strong> {order.shipping_street}, {order.shipping_city}, {order.shipping_state}{" "}
                      {order.shipping_zip}
                    </p>
                    <p>
                      <strong>Total:</strong> ${order.total_amount}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {new Date(order.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  {/* Productos */}
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product.title}</p>
                          <p className="text-muted-foreground">
                            Cantidad: {item.quantity} × ${item.price_at_purchase}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estado de envío */}
                  {hasShipment && shipment ? (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Truck className="h-4 w-4" />
                        <span>Información de Envío</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Tracking:</strong> {shipment.tracking_number}
                        </p>
                        <p>
                          <strong>Carrier:</strong> {shipment.carrier}
                        </p>
                        {shipment.label_url && (
                          <a
                            href={shipment.label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Ver etiqueta de envío
                          </a>
                        )}
                        {shipment.tracking_url && (
                          <a
                            href={shipment.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 ml-4"
                          >
                            Rastrear paquete
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    order.status === "paid" && (
                      <Button onClick={() => handlePurchaseLabel(order)} className="w-full md:w-auto">
                        <Package className="mr-2 h-4 w-4" />
                        Comprar Etiqueta de Envío
                      </Button>
                    )
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {selectedOrder && (
        <ShippingLabelDialog
          order={selectedOrder}
          userId={userId}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </>
  )
}
