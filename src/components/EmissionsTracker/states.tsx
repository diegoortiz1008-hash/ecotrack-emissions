/** Estados de feedback: carga (skeleton), error con reintento y vacío. */
export function LoadingGrid() {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Cargando mediciones…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5" aria-hidden="true">
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-1/2 rounded bg-slate-200" />
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
          <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="text-3xl" aria-hidden="true">⚠️</p>
      <h3 className="mt-2 font-semibold text-rose-900">No pudimos cargar las emisiones</h3>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
      >
        Reintentar
      </button>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
      <p className="text-4xl" aria-hidden="true">🌱</p>
      <h3 className="mt-2 font-semibold text-slate-900">Aún no hay mediciones</h3>
      <p className="mt-1 text-sm text-slate-500">Usa el formulario para registrar la primera fuente de emisiones.</p>
    </div>
  )
}
