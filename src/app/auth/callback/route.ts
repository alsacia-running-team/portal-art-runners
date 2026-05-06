import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

const RECOVERY_COOKIE = 'alsacia_password_recovery'
const RECOVERY_MAX_AGE = 10 * 60

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }

  return next
}

function redirectToRecovery(request: NextRequest, reason: string) {
  const url = new URL('/recuperar-clave', request.url)
  url.searchParams.set('error', reason)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const type = request.nextUrl.searchParams.get('type')
  const next = getSafeNextPath(request.nextUrl.searchParams.get('next'))

  if (!code || type !== 'recovery') {
    return redirectToRecovery(request, 'link-invalido')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectToRecovery(request, 'link-expirado')
  }

  const response = NextResponse.redirect(new URL(next, request.url))
  response.cookies.set(RECOVERY_COOKIE, 'pending', {
    httpOnly: true,
    maxAge: RECOVERY_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
