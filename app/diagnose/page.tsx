import { diagnoseOrder } from "@/app/actions/diagnose"

export default async function DiagnosePage() {
  const result = await diagnoseOrder("e5e96b0c")

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico del Pedido #e5e96b0c</h1>

      {result.success ? (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Información del Pedido</h2>
            <div className="space-y-2">
              <p>
                <strong>Order ID:</strong> {result.order.id}
              </p>
              <p>
                <strong>Comprador:</strong> {result.buyerEmail}
              </p>
              <p>
                <strong>Buyer ID:</strong> {result.order.buyer_id}
              </p>
              <p>
                <strong>Estado:</strong> {result.order.status}
              </p>
              <p>
                <strong>Total:</strong> ${result.order.total_amount}
              </p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Items del Pedido</h2>
            <div className="space-y-4">
              {result.orderItems?.map((item: any, index: number) => (
                <div key={item.id} className="border-l-4 border-primary pl-4 py-2">
                  <p className="font-semibold">
                    {index + 1}. {item.product?.title}
                  </p>
                  <div className="text-sm space-y-1 mt-2">
                    <p>
                      <strong>seller_id en order_items:</strong>{" "}
                      <code className="bg-muted px-2 py-1 rounded">{item.seller_id}</code>
                    </p>
                    <p>
                      <strong>seller_id en products:</strong>{" "}
                      <code className="bg-muted px-2 py-1 rounded">{item.product?.seller_id}</code>
                    </p>
                    <p>
                      <strong>Email del vendedor:</strong> {item.product?.seller?.email}
                    </p>
                    <p className={item.seller_id === item.product?.seller_id ? "text-green-600" : "text-red-600"}>
                      <strong>Estado:</strong>{" "}
                      {item.seller_id === item.product?.seller_id ? "✓ CORRECTO" : "✗ DESAJUSTE - ESTE ES EL PROBLEMA"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">Error: {result.error}</div>
      )}
    </div>
  )
}
