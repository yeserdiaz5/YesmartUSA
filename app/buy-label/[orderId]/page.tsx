import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default async function BuyLabelPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (*)
      )
    `)
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">No se pudo cargar la orden</p>
        </div>
      </div>
    )
  }

  const { data: seller } = await supabaseAdmin.from("users").select("*").eq("id", order.seller_id).single()

  if (!seller) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">No se pudo cargar información del vendedor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Comprar Etiqueta de Envío</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Orden #{order.id}</h2>
        <p className="text-gray-600">Cliente: {order.customer_name}</p>
        <p className="text-gray-600">Dirección: {order.shipping_address}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between py-2 border-b">
            <span>{item.products?.name}</span>
            <span>Cantidad: {item.quantity}</span>
          </div>
        ))}
      </div>

      <form action={`/api/purchase-label`} method="POST">
        <input type="hidden" name="orderId" value={orderId} />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
        >
          Comprar Etiqueta de Envío
        </button>
      </form>
    </div>
  )
}
