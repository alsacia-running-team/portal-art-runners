import Link from 'next/link'

/**
 * Botón flotante "Inicio" para las páginas de autenticación.
 * Se posiciona arriba a la izquierda sobre el contenedor de la página
 * (el padre debe tener `position: relative`). El estilo de pastilla
 * con blur funciona tanto sobre la imagen oscura como sobre el formulario blanco.
 */
export function HomeLinkButton() {
  return (
    <Link
      href="/"
      aria-label="Volver al inicio"
      className="absolute top-4 left-4 lg:top-6 lg:left-6 z-30 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-alsacia-blue-600 shadow-md ring-1 ring-black/5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:text-alsacia-blue-700 hover:shadow-lg"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M3 9.5L12 3l9 6.5" />
        <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
      </svg>
      <span className="hidden sm:inline">Inicio</span>
    </Link>
  )
}
