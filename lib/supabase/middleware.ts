import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  let user = null
  let authError = null

  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    user = authUser
    authError = error
  } catch (error) {
    console.error("[v0] Middleware - Unexpected error during auth check:", error)
    // Continue without user - don't break the app
  }

  // Define routes that require authentication
  const protectedRoutes = ["/seller", "/admin", "/orders", "/createlabel", "/createlabelplus"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Don't log "Auth session missing!" as it's expected when user is not logged in
  if (authError && isProtectedRoute && authError.message !== "Auth session missing!") {
    console.error("[v0] Middleware - Unexpected auth error on protected route:", authError.message)
  }

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
      // Allow the request to continue - role checks will happen at page level
    }
  }

  return supabaseResponse
}
