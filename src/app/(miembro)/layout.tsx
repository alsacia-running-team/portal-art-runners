'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const menuItems = [
  { label: 'Mi perfil', href: '/miembro/perfil' },
  { label: 'Editar datos', href: '/miembro/editar' },
  { label: 'Realizar pago', href: '/miembro/pagar' },
  { label: 'Historial de pagos', href: '/miembro/pagos' },
]

export default function MiembroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h2 className="text-lg font-bold mb-1">Alsacia Running</h2>
        <p className="text-sm text-gray-400 mb-8">Portal del miembro</p>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white text-gray-900 font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </aside>

      <main className="flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}