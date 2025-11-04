"use client";
import React, { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  product: any;
  quantity: number;
  price: number;
};

type Compra = {
  id: string;
  status: string;
  created_at: string;
  total: number;
  order_items: OrderItem[];
  shipping_address?: any;
};

export default function ComprasClient() {
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompras() {
      try {
        const res = await fetch("/api/compras", { cache: "no-store" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setCompras(data);
      } catch (err: any) {
        setError(err.message || "Error al obtener compras");
      } finally {
        setLoading(false);
      }
    }
    fetchCompras();
  }, []);

  if (loading) return <div>Cargando tus compras…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!compras || compras.length === 0) return <div>No tienes compras todavía.</div>;

  return (
    <div className="space-y-6">
      {compras.map((order) => (
        <div key={order.id} className="border rounded p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Orden #{order.id}</div>
              <div className="text-xs text-gray-500">Estado: {order.status}</div>
              <div className="text-xs text-gray-500">Fecha: {new Date(order.created_at).toLocaleString()}</div>
            </div>
            <div className="text-lg font-semibold">${order.total?.toFixed(2)}</div>
          </div>

          <div className="mt-3 space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img src={item.product?.image || "/placeholder.png"} alt={item.product?.name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{item.product?.name}</div>
                  <div className="text-sm text-gray-500">Cantidad: {item.quantity}</div>
                </div>
                <div className="font-medium">${(item.price || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {order.shipping_address && (
            <div className="mt-3 text-sm text-gray-600">
              <div>Envío a:</div>
              <div>{order.shipping_address.recipient}</div>
              <div>
                {order.shipping_address.line1} {order.shipping_address.city}, {order.shipping_address.state}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}