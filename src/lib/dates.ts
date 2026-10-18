// Toda la plataforma opera en hora de Colombia, sin importar la zona horaria
// del navegador o del servidor (Vercel corre en UTC).
export const APP_TIME_ZONE = 'America/Bogota'

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

type DateStyle = 'long' | 'short'

/** Fecha de hoy en Bogotá como 'YYYY-MM-DD' (mismo formato que las columnas `date`). */
export function todayInBogota(): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Formatea fechas para mostrar en español.
 * - 'YYYY-MM-DD' (columnas `date`): es un día de calendario, se muestra tal cual.
 *   `new Date('2026-10-14')` lo interpretaría como medianoche UTC y en Colombia
 *   mostraría el 13, por eso no se pasa por conversión de zona horaria.
 * - Timestamps (paid_at, created_at): se convierten a hora de Bogotá.
 */
export function formatDate(value: string | null | undefined, style: DateStyle = 'long', empty = 'No registrada') {
  if (!value) return empty

  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: style, day: 'numeric' }
  const dateOnly = DATE_ONLY.exec(value)

  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    return date.toLocaleDateString('es-CO', { ...options, timeZone: 'UTC' })
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return empty
  return date.toLocaleDateString('es-CO', { ...options, timeZone: APP_TIME_ZONE })
}

/** El pago está pendiente desde el día de `next_payment_date` (hora Bogotá). */
export function isPaymentDue(nextPaymentDate: string | null | undefined) {
  if (!nextPaymentDate) return true
  return todayInBogota() >= nextPaymentDate.slice(0, 10)
}
