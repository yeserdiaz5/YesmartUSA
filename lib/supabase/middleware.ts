import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Get tokens from cookies
  const accessToken = request.cookies.get("sb-access-token")?.value
  const refreshToken = request.cookies.get("sb-refresh-token")?.value

  // Create a regular Supabase client
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

  let user = null
  let authError = null

  try {
    // If we have tokens, set the session and try to refresh
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        authError = error
      } else {
        user = data.user

        // If session was refreshed, update cookies
        if (data.session) {
          supabaseResponse.cookies.set("sb-access-token", data.session.access_token, {
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "lax",
          })
          supabaseResponse.cookies.set("sb-refresh-token", data.session.refresh_token, {
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "lax",
          })
        }
      }
    }
  } catch (error) {
    console.error("[v0] Middleware - Unexpected error during auth check:", error)
  }

  // Define routes that require authentication
  const protectedRoutes = ["/seller", "/admin", "/orders"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Redirect to login only if accessing protected routes without authentication
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    try {
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (userProfile?.role !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error("[v0] Middleware - Error checking admin role:", error)
    }
  }

  return supabaseResponse
}
