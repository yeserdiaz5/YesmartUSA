// API route para devolver estadísticas (server-only). Protege con auth en producción.
import { NextResponse } from 'next/server'
import { getStripeStats } from '../../../lib/stripe'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const connectedAccount = url.searchParams.get('connectedAccount') || undefined
    const daysParam = url.searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 30

    // TODO: En producción validar que el requester es admin o el vendedor propietario.
    const stats = await getStripeStats({ connectedAccount, days })

    return NextResponse.json({ ok: true, stats })
  } catch (err: any) {
    console.error('Stripe stats error', err)
    return NextResponse.json({ ok: false, error: err.message ?? String(err) }, { status: 500 })
  }
}
