import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    if (pathname === '/admin/login') {
      if (user) {
        // You might want to check the user role here in a real app, 
        // but for now redirecting to dashboard if already logged in.
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    } else {
      // Non-login admin routes
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }
  }

  // Player protected routes
  const playerProtectedRoutes = ['/wallet', '/my-matches', '/withdraw', '/profile', '/notifications']
  const isPlayerProtected = playerProtectedRoutes.some(route => pathname.startsWith(route))

  if (isPlayerProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/setup-profile')) {
    // Let the page handle redirect based on profile completion
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
