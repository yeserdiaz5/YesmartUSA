import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CreateLabelClient from "./create-label-client"

export default async function CreateLabelPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get order if orderId is provided
  let order = null
  if (searchParams.orderId) {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", searchParams.orderId)
      .single()
    order = data
  }

  return <CreateLabelClient user={profile} order={order} />
}
