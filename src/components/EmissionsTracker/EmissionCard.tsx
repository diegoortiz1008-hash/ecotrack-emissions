import { memo } from 'react'
import { CATEGORY_META } from '../../constants/categories'
import type { Emission } from '../../types'
import { formatCo2, formatDate } from '../../utils/format'

interface EmissionCardProps {
  emission: Emission
  /** Porcentaje (0-100) respecto a la fuente con más emisiones. */
  relativeShare: number
}

/** Tarjeta presentacional. `memo` evita re-render si sus props no cambian. */
export const EmissionCard = memo(function EmissionCard({ emission, relativeShare }: EmissionCardProps) {
  const meta = CATEGORY_META[emission.category]

  return (
    <article
      aria-labelledby={`emission-${emission.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <header className="flex flex-col items-start gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
        >
          <span aria-hidden="true">{meta.icon}</span>
          {meta.label}
        </span>
        <h3 id={`emission-${emission.id}`} className="font-semibold leading-snug text-slate-900">
          {emission.sourceName}
        </h3>
      </header>

      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {formatCo2(emission.co2Kg)}
        <span className="ml-1 text-sm font-medium text-slate-500">CO₂e</span>
      </p>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-label={`Peso relativo de ${emission.sourceName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(relativeShare)}
      >
        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.max(relativeShare, 2)}%` }} />
      </div>

      <footer className="text-xs text-slate-500">
        Registrado el <time dateTime={emission.createdAt.toISOString()}>{formatDate(emission.createdAt)}</time>
      </footer>
    </article>
  )
})
