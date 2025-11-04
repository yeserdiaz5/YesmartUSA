// Página server component: muestra resumen y permite seleccionar connected account
import React from 'react'
import { getStripeStats } from '@/lib/stripe'
import PayoutsClient from './payouts-client'

// Nota: este componente se ejecuta en servidor. Para interactividad usamos PayoutsClient.
export default async function AdminPayoutsPage({ searchParams }: { searchParams?: any }) {
  // Si quieres cargar valores por defecto (por ejemplo: plataforma global), no pases connectedAccount.
  const connectedAccount = searchParams?.connectedAccount || undefined
  const days = Number(searchParams?.days || 30)

  // Carga inicial para render server-side
  const stats = await getStripeStats({ connectedAccount, days })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Stripe — Payouts & Earnings</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Resumen (últimos {days} días){connectedAccount ? ` — ${connectedAccount}` : ' — global'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Available balance</div>
            <div className="text-xl">
              { (stats.balance?.available?.[0]?.amount ?? 0) / 100 } { stats.balance?.available?.[0]?.currency?.toUpperCase() }
            </div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Pending balance</div>
            <div className="text-xl">
              { (stats.balance?.pending?.[0]?.amount ?? 0) / 100 } { stats.balance?.pending?.[0]?.currency?.toUpperCase() }
            </div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Ventas (síntesis)</div>
            <div className="text-xl">
              { (stats.summary.totalSales / 100).toFixed(2) }
            </div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Net (estimado)</div>
            <div className="text-xl">
              { (stats.summary.net / 100).toFixed(2) }
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Últimos payouts</h2>
        <div className="mt-3">
          <ul className="divide-y">
            {stats.payouts.map((p: any) => (
              <li key={p.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium">{p.id}</div>
                  <div className="text-sm text-gray-600">{new Date(p.arrival_date * 1000).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div>{(p.amount / 100).toFixed(2)} {p.currency?.toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{p.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Interactividad</h2>
        {/* Componente cliente para seleccionar seller, refrescar y ver detalles */}
        {/* Pasa valores iniciales para hidratación */}
        {/* @ts-ignore-next-line Server Component -> Client Component */}
        <PayoutsClient initialStats={stats} />
      </section>
    </div>
  )
}
