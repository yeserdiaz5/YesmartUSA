import { createServerClient } from "@/lib/supabase/server"
import CreateLabelPlusClient from "./create-label-plus-client"
import { redirect } from "next/navigation"

export default async function CreateLabelPlusPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let orderData = null
  if (searchParams.orderId) {
    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (
            title,
            image_url
          )
        )
      `)
      .eq("id", searchParams.orderId)
      .single()

    orderData = order
  }

  const { data: sellerProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return <CreateLabelPlusClient user={user} orderData={orderData} sellerProfile={sellerProfile} />
}
