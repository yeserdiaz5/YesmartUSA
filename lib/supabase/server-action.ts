import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerActionClient() {
  const cookieStore = await cookies()

  const allCookies = cookieStore.getAll()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return allCookies
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Server actions can't set cookies in some contexts
          console.warn("[v0] Could not set cookies in server action:", error)
        }
      },
    },
  })
}
