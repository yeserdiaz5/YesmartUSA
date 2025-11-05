import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import TiendaClient from "./tienda-client"

interface PageProps {
  params: {
    sellerId: string
  }
}

export default async function TiendaPage({ params }: PageProps) {
  const supabase = await createClient()
  
  // Obtener el usuario actual (puede ser null si es invitado)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  
  let currentUser = null
  if (authUser) {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()
    currentUser = userData
  }

  // Obtener información del seller
  const { data: seller, error: sellerError } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.sellerId)
    .single()

  if (sellerError || !seller) {
    notFound()
  }

  // Obtener productos activos del seller
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        category:categories (*)
      ),
      product_tags (
        tag:tags (*)
      )
    `,
    )
    .eq("seller_id", params.sellerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (productsError) {
    console.error("Error fetching products:", productsError)
    return (
      <TiendaClient
        seller={seller}
        products={[]}
        currentUser={currentUser}
      />
    )
  }

  return (
    <TiendaClient
      seller={seller}
      products={products || []}
      currentUser={currentUser}
    />
  )
}
