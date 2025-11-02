import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrderById } from "@/app/actions/orders"
import { getOrderShipments } from "@/app/actions/shipments"
import OrderDetailsClient from "./order-details-client"

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const orderResult = await getOrderById(params.id)
  if (!orderResult.success || !orderResult.data) {
    redirect("/my-orders")
  }

  const shipmentsResult = await getOrderShipments(params.id)
  const shipments = shipmentsResult.success ? shipmentsResult.data || [] : []

  return <OrderDetailsClient user={userProfile} order={orderResult.data} shipments={shipments} />
}
