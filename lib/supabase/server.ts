import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  // Read session from cookies
  const accessToken = cookieStore.get("sb-access-token")?.value
  const refreshToken = cookieStore.get("sb-refresh-token")?.value

  console.log("[v0] Server createClient - Has access token:", !!accessToken)
  console.log("[v0] Server createClient - Has refresh token:", !!refreshToken)

  if (accessToken && refreshToken) {
    // Set the session manually
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error("[v0] Error setting session:", error)
    } else {
      console.log("[v0] Session set successfully, user:", data.user?.email)
    }
  }

  return supabase
}

export { createClient as createServerClient }
