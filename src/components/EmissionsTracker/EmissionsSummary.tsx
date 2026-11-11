import { memo } from 'react'
import { CATEGORY_META } from '../../constants/categories'
import type { EmissionsTotals } from '../../hooks/useEmissions'
import { EMISSION_CATEGORIES } from '../../types'
import { formatCo2 } from '../../utils/format'

interface EmissionsSummaryProps {
  totals: EmissionsTotals
  count: number
}

export const EmissionsSummary = memo(function EmissionsSummary({ totals, count }: EmissionsSummaryProps) {
  return (
    <section aria-label="Resumen de emisiones" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <div>
          <p className="text-sm text-slate-300">Total CO₂e</p>
          <p className="text-3xl font-bold tracking-tight">{formatCo2(totals.totalKg)}</p>
        </div>
        <p className="text-sm text-slate-300">
          {count} {count === 1 ? 'fuente registrada' : 'fuentes registradas'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {EMISSION_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category]
          const value = totals.byCategory[category]
          const pct = totals.totalKg > 0 ? Math.round((value / totals.totalKg) * 100) : 0
          return (
            <div key={category} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-500 sm:text-sm">
                <span aria-hidden="true">{meta.icon}</span> {meta.label}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{formatCo2(value)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{pct}% del total</p>
            </div>
          )
        })}
      </div>
    </section>
  )
})
