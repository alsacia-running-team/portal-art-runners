'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useProtectedSession() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function redirectIfSignedOut() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
      }
    }

    void redirectIfSignedOut()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    window.addEventListener('pageshow', redirectIfSignedOut)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', redirectIfSignedOut)
    }
  }, [router])
}
