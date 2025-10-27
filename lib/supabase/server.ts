import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  try {
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore errors when setting cookies (happens in middleware)
          }
        },
      },
    })
  } catch (error) {
    console.error("[v0] Supabase SSR client creation failed, using basic client:", error)

    // Fallback: Return a basic client without SSR features
    const { createClient: createBasicClient } = await import("@supabase/supabase-js")
    return createBasicClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
}

export { createClient as createServerClient }
