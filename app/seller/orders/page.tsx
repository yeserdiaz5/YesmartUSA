import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { OrdersList } from "@/components/orders-list"

export default async function SellerOrdersPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener órdenes donde el usuario es vendedor
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        product:products (
          title,
          image_url
        )
      ),
      shipments (
        id,
        tracking_number,
        carrier,
        status,
        label_url,
        tracking_url
      )
    `)
    .eq("order_items.seller_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching orders:", error)
    return <div className="p-8 text-red-500">Error al cargar las órdenes</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Mis Órdenes de Venta</h1>
      <OrdersList orders={orders || []} userId={user.id} />
    </div>
  )
}
