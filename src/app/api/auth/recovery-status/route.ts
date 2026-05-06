import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const RECOVERY_COOKIE = 'alsacia_password_recovery'

export async function GET() {
  const cookieStore = await cookies()
  const hasRecoveryCookie = cookieStore.get(RECOVERY_COOKIE)?.value === 'pending'

  if (!hasRecoveryCookie) {
    return NextResponse.json({ valid: false })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return NextResponse.json({ valid: Boolean(user) })
}
