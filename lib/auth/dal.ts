"use server"

import { cache } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// Data Access Layer - Validates auth at data access point, not in middleware
export const verifySession = cache(async () => {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Component can't set cookies
          }
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { isAuth: false, user: null, userId: null }
  }

  return { isAuth: true, user, userId: user.id }
})

// Get current user or throw error
export async function getCurrentUser() {
  const session = await verifySession()

  if (!session.isAuth || !session.user) {
    throw new Error("Unauthorized")
  }

  return session.user
}

// Get current user ID or throw error
export async function getCurrentUserId() {
  const session = await verifySession()

  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized")
  }

  return session.userId
}
