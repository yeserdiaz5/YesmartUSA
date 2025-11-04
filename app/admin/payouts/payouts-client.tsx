'use client'
import React, { useState } from 'react'

type Props = {
  initialStats: any
}

export default function PayoutsClient({ initialStats }: Props) {
  const [stats, setStats] = useState(initialStats)
  const [connectedAccount, setConnectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  async function fetchStats() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (connectedAccount) params.set('connectedAccount', connectedAccount)
      params.set('days', String(days))
      const res = await fetch(`/api/stripe/stats?${params.toString()}`)
      const data = await res.json()
      if (data.ok) setStats(data.stats)
      else alert('Error: ' + (data.error || 'unknown'))
    } catch (err) {
      console.error(err)
      alert('Error fetching stats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded">
      <div className="flex gap-2 mb-3">
        <input
          className="border px-2 py-1 rounded flex-1"
          placeholder="Connected account ID (ej. acct_...)"
          value={connectedAccount}
          onChange={(e) => setConnectedAccount(e.target.value)}
        />
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border px-2 py-1 rounded">
          <option value={7}>7d</option>
          <option value={30}>30d</option>
          <option value={90}>90d</option>
        </select>
        <button onClick={fetchStats} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded">
          {loading ? 'Cargando...' : 'Refrescar'}
        </button>
      </div>

      <div className="text-sm text-gray-700">
        <div><strong>Ventas totales:</strong> {(stats.summary.totalSales / 100).toFixed(2)}</div>
        <div><strong>Reembolsos:</strong> {(stats.summary.totalRefunds / 100).toFixed(2)}</div>
        <div><strong>Comisiones estimadas:</strong> {(stats.summary.fees / 100).toFixed(2)}</div>
        <div><strong>Neto estimado:</strong> {(stats.summary.net / 100).toFixed(2)}</div>
        <div><strong>Cargos:</strong> {stats.summary.chargesCount}</div>
        <div><strong>Disputas:</strong> {stats.summary.disputesCount}</div>
      </div>
    </div>
  )
}
