"use client"

import { Store, ShoppingCart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { addToCart } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import { addToGuestCart } from "@/lib/guest-cart"

interface TiendaClientProps {
  seller: User
  products: any[]
  currentUser: User | null
}

export default function TiendaClient({ seller, products, currentUser }: TiendaClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Determinar la URL de pagos basada en si el seller tiene stripe_account_id
  const payoutsUrl = seller.stripe_account_id
    ? `/admin/payouts?connectedAccount=${seller.stripe_account_id}`
    : "/admin/payouts"

  const handleAddToCart = async (product: any) => {
    // Para invitados, usar localStorage
    if (!currentUser) {
      addToGuestCart(
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          seller_id: product.seller_id,
        },
        1,
      )
      toast({
        title: "Producto agregado",
        description: "Producto agregado al carrito",
      })
      // Redirigir al carrito
      router.push("/cartplus")
      return
    }

    // Para usuarios autenticados, usar base de datos
    const result = await addToCart(product.id, 1)

    if (result && result.success) {
      toast({
        title: "Producto agregado",
        description: "Producto agregado al carrito",
      })
      // Redirigir al carrito
      router.push("/cartplus")
    } else {
      toast({
        title: "Error",
        description: result?.error || "No se pudo agregar el producto al carrito",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <SiteHeader user={currentUser} />
      <div className="min-h-screen bg-gray-50">
        {/* Header/Hero Section con botón de pagos */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {seller.store_name || seller.full_name || "Tienda"}
                  </h1>
                  <p className="text-blue-100">
                    Vendedor: {seller.full_name || seller.email}
                  </p>
                </div>
              </div>
              
              {/* Botón de pagos visible para todos */}
              <div>
                <Link href={payoutsUrl}>
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Ver Pagos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Productos</h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Esta tienda no tiene productos disponibles
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <Link href={`/productdes/${product.id}`}>
                      <div className="relative mb-3 cursor-pointer">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      </div>
                    </Link>

                    <Link href={`/productdes/${product.id}`}>
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price}
                      </span>
                      
                      {/* Badge de stock */}
                      {product.stock_quantity > 0 ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          En stock
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Agotado
                        </Badge>
                      )}
                    </div>

                    {/* Botón CTA "Comprar" */}
                    <Button
                      size="lg"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Comprar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
