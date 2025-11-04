// Wrapper y funciones servidoras para obtener estadísticas de Stripe
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY in env')
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2022-11-15',
})

type StatsOptions = {
  connectedAccount?: string // acct_...
  days?: number
}

export async function getStripeStats(options: StatsOptions = {}) {
  const { connectedAccount, days = 30 } = options
  const since = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

  const callOpts = connectedAccount ? { stripeAccount: connectedAccount } : {}

  // Balance (available & pending)
  const balance = await stripe.balance.retrieve({}, callOpts as any)

  // Recent payouts
  const payouts = await stripe.payouts.list({ limit: 20 }, callOpts as any)

  // Charges in last `days`. We request up to 100 and filter by created >= since.
  // NOTE: for high volume, implement pagination & server-side aggregation.
  const chargesList = await stripe.charges.list({ limit: 100, expand: ['data.balance_transaction'] }, callOpts as any)
  const chargesRecent = chargesList.data.filter((c) => (c.created ?? 0) >= since)

  // Aggregate simple metrics (amounts in cents)
  const totalSales = chargesRecent.reduce((sum, c) => sum + (c.amount ?? 0), 0)
  const totalRefunds = chargesRecent.reduce((sum, c) => {
    if ((c.refunded ?? false) && c.amount_refunded) return sum + (c.amount_refunded ?? 0)
    return sum
  }, 0)
  const chargesCount = chargesRecent.length
  const failedPayments = chargesRecent.filter((c) => c.status === 'failed').length
  const disputesList = await stripe.disputes.list({ limit: 50 }, callOpts as any)
  const disputesCount = disputesList.data.length

  // Fees estimate (sum of balance_transaction.fee if present)
  const fees = chargesRecent.reduce((sum, c) => {
    const bt = (c as any).balance_transaction
    if (bt && typeof bt.fee === 'number') return sum + bt.fee
    return sum
  }, 0)

  return {
    balance,
    payouts: payouts.data,
    chargesRecent,
    summary: {
      totalSales, // cents
      totalRefunds,
      net: totalSales - totalRefunds - fees,
      chargesCount,
      failedPayments,
      disputesCount,
      fees,
    },
  }
}

export default stripe
