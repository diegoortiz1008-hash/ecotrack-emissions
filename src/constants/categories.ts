import type { EmissionCategory } from '../types'

interface CategoryMeta {
  label: string
  icon: string
  /** Clases completas (Tailwind necesita strings literales, no interpolados). */
  badge: string
  bar: string
}

export const CATEGORY_META: Record<EmissionCategory, CategoryMeta> = {
  transporte: {
    label: 'Transporte',
    icon: '🚚',
    badge: 'bg-sky-100 text-sky-800 ring-sky-600/20',
    bar: 'bg-sky-500',
  },
  energia: {
    label: 'Energía',
    icon: '⚡',
    badge: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    bar: 'bg-amber-500',
  },
  residuos: {
    label: 'Residuos',
    icon: '♻️',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    bar: 'bg-emerald-500',
  },
}
