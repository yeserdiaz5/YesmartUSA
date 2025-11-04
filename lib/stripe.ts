import "server-only"

import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export { stripe as default }

export async function getStripeStats() {
  try {
    const balance = await stripe.balance.retrieve()
    const charges = await stripe.charges.list({ limit: 10 })

    return {
      success: true,
      data: {
        balance,
        charges: charges.data,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching Stripe stats:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
