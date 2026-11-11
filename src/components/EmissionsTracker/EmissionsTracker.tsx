import { useMemo } from 'react'
import { useEmissions } from '../../hooks/useEmissions'
import { EmissionCard } from './EmissionCard'
import { EmissionForm } from './EmissionForm'
import { EmissionsSummary } from './EmissionsSummary'
import { EmptyState, ErrorState, LoadingGrid } from './states'

/**
 * Componente contenedor: conecta el hook useEmissions con la UI.
 * No contiene lógica de datos; solo decide qué estado mostrar.
 */
export function EmissionsTracker() {
  const {
    emissions,
    status,
    error,
    totals,
    dataSource,
    isSubmitting,
    submitError,
    addEmission,
    retry,
    clearSubmitError,
  } = useEmissions()

  // Máximo para la barra relativa de cada tarjeta (se recalcula solo si cambia la lista)
  const maxKg = useMemo(() => Math.max(0, ...emissions.map((e) => e.co2Kg)), [emissions])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">EcoTrack</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard de Emisiones en Tiempo Real
          </h1>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 sm:self-auto">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {dataSource === 'supabase' ? 'Conectado a Supabase · Realtime' : 'Modo demo · datos simulados'}
        </span>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="order-2 space-y-6 lg:order-1">
          {status === 'success' && <EmissionsSummary totals={totals} count={emissions.length} />}

          <section aria-labelledby="sources-title">
            <h2 id="sources-title" className="mb-4 text-lg font-semibold text-slate-900">
              Fuentes de emisión
            </h2>
            {status === 'loading' && <LoadingGrid />}
            {status === 'error' && error && <ErrorState message={error} onRetry={retry} />}
            {status === 'success' && emissions.length === 0 && <EmptyState />}
            {status === 'success' && emissions.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {emissions.map((emission) => (
                  <li key={emission.id}>
                    <EmissionCard
                      emission={emission}
                      relativeShare={maxKg > 0 ? (emission.co2Kg / maxKg) * 100 : 0}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-8">
            <EmissionForm
              onSubmit={addEmission}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onDismissError={clearSubmitError}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
