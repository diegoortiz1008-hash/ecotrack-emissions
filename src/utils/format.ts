const kgFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const tonFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

/** 950 -> "950 kg", 12500 -> "12,5 t" */
export function formatCo2(kg: number): string {
  return kg >= 1000 ? `${tonFormatter.format(kg / 1000)} t` : `${kgFormatter.format(kg)} kg`
}

export const formatDate = (date: Date): string => dateFormatter.format(date)

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado'
