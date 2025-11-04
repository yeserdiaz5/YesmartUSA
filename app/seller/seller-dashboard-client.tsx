"use client"

import { useState } from "react"
import { Plus, TrendingUp, Package, Edit, BarChart3, DollarSign, Settings, ShoppingBag, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SellerDashboardClientProps {
  user: User
  products: any[]
  orders: any[]
}

function TrustScoreDisplay({ score }: { score: number }) {
  const getScoreData = (score: number) => {
    if (score >= 90)
      return {
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        icon: "🛡️",
      }
    if (score >= 80)
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "✅",
      }
    if (score >= 70)
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        icon: "⚠️",
      }
    return {
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "❌",
    }
  }

  const scoreData = getScoreData(score)

  return (
    <div className={`text-center p-4 rounded-xl ${scoreData.bgColor}`}>
      <div className="text-2xl mb-2">{scoreData.icon}</div>
      <div className={`text-4xl font-bold ${scoreData.color} mb-1`}>{score}</div>
      <div className="text-sm text-gray-600 mb-3">Trust Score</div>
      <Progress value={score} className="h-2" />
    </div>
  )
}

export default function SellerDashboardClient({ user, products, orders }: SellerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  const activeListings = products.filter((p) => p.is_active).length
  const totalListings = products.length
  const trustScore = 85

  const monthlyRevenue = orders.reduce((sum, order) => {
    const orderTotal = order.items.reduce((itemSum: number, item: any) => {
      return itemSum + item.price_at_purchase * item.quantity
    }, 0)
    return sum + orderTotal
  }, 0)

  const totalSales = orders.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mi Tienda</h1>
              <p className="text-blue-100">Bienvenido, {user.full_name || user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/seller/pagos">
                <Button className="bg-white text-green-600 hover:bg-green-50 shadow-lg">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pagos
                </Button>
              </Link>
              <Link href="/orders">
                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <List className="w-5 h-5 mr-2" />
                  Órdenes
                </Button>
              </Link>
              <Link href="/seller/settings">
                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Settings className="w-5 h-5 mr-2" />
                  Configuración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              Mis Productos
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrustScoreDisplay score={trustScore} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Ingresos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">${monthlyRevenue.toLocaleString()}</div>
                  <div className="flex items-center text-sm text-green-600 mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% vs mes anterior
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Ventas Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{totalSales.toLocaleString()}</div>
                  <div className="text-sm text-blue-600 mt-2">Todas las ventas</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Productos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{activeListings}</div>
                  <div className="text-sm text-purple-600 mt-2">de {totalListings} totales</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Pedido #{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(order.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="font-bold text-green-600 text-lg">
                          $
                          {order.items
                            .reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Desglose de Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Calidad del Producto</span>
                        <span className="font-bold text-emerald-600">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Velocidad de Envío</span>
                        <span className="font-bold text-blue-600">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Servicio al Cliente</span>
                        <span className="font-bold text-purple-600">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Precisión de Descripción</span>
                        <span className="font-bold text-indigo-600">90%</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Mis Productos</h2>
              <Link href="/seller/products/new">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar Producto
                </Button>
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => {
                  const trustScore = 75 + Math.floor(Math.random() * 20)
                  const views = Math.floor(Math.random() * 2000)
                  const sales = Math.floor(Math.random() * 200)

                  return (
                    <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.title}
                            className="w-20 h-20 object-cover rounded-xl shadow-md"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-bold text-green-600">${product.price}</span>
                              <span className="text-gray-600">Stock: {product.stock_quantity}</span>
                              <Badge
                                className={
                                  product.is_active
                                    ? "bg-green-100 text-green-700 border-0"
                                    : "bg-gray-100 text-gray-700 border-0"
                                }
                              >
                                {product.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-xs text-gray-500 mb-1">Trust Score</div>
                            <div className="text-xl font-bold text-emerald-600">{trustScore}%</div>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-xs text-gray-500 mb-1">Vistas</div>
                            <div className="text-xl font-bold text-blue-600">{views}</div>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-xs text-gray-500 mb-1">Ventas</div>
                            <div className="text-xl font-bold text-purple-600">{sales}</div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/seller/products/${product.id}/edit`}>
                              <Button variant="outline" size="sm" className="hover:bg-blue-50 bg-transparent">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No tienes productos aún</h3>
                  <p className="text-gray-600 mb-6">Comienza a vender agregando tu primer producto</p>
                  <Link href="/seller/products/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Agregar Tu Primer Producto
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-600">Gráficos próximamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Tendencia de Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                      <p className="text-gray-600">Gráficos próximamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
