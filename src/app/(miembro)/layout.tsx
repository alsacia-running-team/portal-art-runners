'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const menuItems = [
  {
    label: 'Mi perfil',
    href: '/miembro/perfil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    label: 'Editar datos',
    href: '/miembro/editar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    label: 'Realizar pago',
    href: '/miembro/pagar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    label: 'Historial de pagos',
    href: '/miembro/pagos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
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
      <header className="md:hidden bg-alsacia-blue-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Alsacia"
            width={120}
            height={30}
            className="h-7 w-auto mix-blend-screen"
            priority
          />
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md hover:bg-alsacia-blue-700 transition-colors"
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
        <nav className="md:hidden bg-alsacia-blue-800 text-white px-4 pb-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-alsacia-cyan-400 text-alsacia-blue-900 font-semibold'
                  : 'text-alsacia-blue-100 hover:bg-alsacia-blue-700'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <Button
            variant="outline"
            className="w-full mt-3 border-alsacia-blue-300 bg-transparent text-white hover:bg-alsacia-blue-700 hover:text-white"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </nav>
      )}

      {/* Menú lateral escritorio */}
      <aside className="hidden md:flex w-64 bg-alsacia-blue-800 text-white p-6 flex-col">
        <div className="mb-8">
          <Image
            src="/images/logo.png"
            alt="Alsacia Running Team"
            width={200}
            height={50}
            className="h-10 w-auto mix-blend-screen mb-3"
            priority
          />
          <p className="text-xs text-alsacia-blue-300 uppercase tracking-wider font-semibold">
            Portal del miembro
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-alsacia-cyan-400 text-alsacia-blue-900 font-semibold'
                  : 'text-alsacia-blue-100 hover:bg-alsacia-blue-700'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          className="mt-4 border-alsacia-blue-300 bg-transparent text-white hover:bg-alsacia-blue-700 hover:text-white"
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
