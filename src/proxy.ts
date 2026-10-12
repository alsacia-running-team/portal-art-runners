import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirige conservando las cookies de sesión que Supabase haya refrescado.
  function redirectTo(path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      response.cookies.set(cookie)
    )
    return response
  }

  // Si no hay usuario y está intentando entrar a rutas protegidas
  if (!user) {
    return redirectTo('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, account_status')
    .eq('auth_id', user.id)
    .maybeSingle()

  // Sin perfil o con la solicitud aún pendiente no hay acceso al portal
  if (!profile || profile.account_status === 'pending') {
    return redirectTo('/login')
  }

  // El panel de administración es solo para administradores
  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    return redirectTo('/miembro/perfil')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/miembro/:path*', '/admin/:path*'],
}
