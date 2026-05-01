'use client'

import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Header móvil */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Alsacia Running</h2>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md hover:bg-gray-800 transition-colors"
          aria-label="Abrir menú"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <nav className="md:hidden bg-gray-900 text-white px-4 pb-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white text-gray-900 font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </nav>
      )}

      {/* Menú lateral escritorio */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white p-6 flex-col">
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

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-50 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}