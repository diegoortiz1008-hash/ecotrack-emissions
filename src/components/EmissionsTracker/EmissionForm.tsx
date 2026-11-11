import { useId, useState, type FormEvent } from 'react'
import { CATEGORY_META } from '../../constants/categories'
import { EMISSION_CATEGORIES, isEmissionCategory, type NewEmission } from '../../types'
import { EMPTY_FORM, validateEmission, type FieldErrors, type FormValues } from '../../utils/validateEmission'
import { Spinner } from './Spinner'

interface EmissionFormProps {
  onSubmit: (input: NewEmission) => Promise<boolean>
  isSubmitting: boolean
  submitError: string | null
  onDismissError: () => void
}

const inputBase =
  'block w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50'
const inputState = (hasError: boolean) =>
  hasError
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'

export function EmissionForm({ onSubmit, isSubmitting, submitError, onDismissError }: EmissionFormProps) {
  const id = useId()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSuccessMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { errors: found, data } = validateEmission(values)
    setErrors(found)
    if (!data) {
      const firstInvalid = (Object.keys(found) as (keyof FormValues)[])[0]
      document.getElementById(`${id}-${firstInvalid}`)?.focus()
      return
    }
    const ok = await onSubmit(data)
    if (ok) {
      setValues(EMPTY_FORM)
      setSuccessMessage(`“${data.sourceName}” se registró correctamente.`)
    }
  }

  const fieldError = (field: keyof FormValues) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="mt-1.5 text-sm text-rose-600">
        {errors[field]}
      </p>
    ) : null

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={`${id}-title`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900">
        Nueva medición
      </h2>
      <p className="mt-1 text-sm text-slate-500">Registra las emisiones de una fuente.</p>

      <fieldset disabled={isSubmitting} className="mt-5 space-y-4">
        <div>
          <label htmlFor={`${id}-sourceName`} className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre de la fuente
          </label>
          <input
            id={`${id}-sourceName`}
            type="text"
            autoComplete="off"
            placeholder="Ej. Flota de reparto Bogotá"
            value={values.sourceName}
            onChange={(e) => update('sourceName', e.target.value)}
            aria-invalid={Boolean(errors.sourceName)}
            aria-describedby={errors.sourceName ? `${id}-sourceName-error` : undefined}
            className={`${inputBase} ${inputState(Boolean(errors.sourceName))}`}
          />
          {fieldError('sourceName')}
        </div>

        <div>
          <label htmlFor={`${id}-category`} className="mb-1.5 block text-sm font-medium text-slate-700">
            Categoría
          </label>
          <select
            id={`${id}-category`}
            value={values.category}
            onChange={(e) => update('category', isEmissionCategory(e.target.value) ? e.target.value : '')}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? `${id}-category-error` : undefined}
            className={`${inputBase} ${inputState(Boolean(errors.category))}`}
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {EMISSION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
          {fieldError('category')}
        </div>

        <div>
          <label htmlFor={`${id}-co2Kg`} className="mb-1.5 block text-sm font-medium text-slate-700">
            CO₂ producido <span className="font-normal text-slate-500">(kg)</span>
          </label>
          <input
            id={`${id}-co2Kg`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={values.co2Kg}
            onChange={(e) => update('co2Kg', e.target.value)}
            aria-invalid={Boolean(errors.co2Kg)}
            aria-describedby={errors.co2Kg ? `${id}-co2Kg-error` : undefined}
            className={`${inputBase} ${inputState(Boolean(errors.co2Kg))}`}
          />
          {fieldError('co2Kg')}
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4" /> Guardando…
            </>
          ) : (
            'Agregar medición'
          )}
        </button>
      </fieldset>

      {/* Feedback accesible: los lectores de pantalla anuncian éxito y error */}
      <div aria-live="polite" className="mt-4 empty:hidden">
        {successMessage && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">✓ {successMessage}</p>
        )}
      </div>
      {submitError && (
        <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={onDismissError}
            className="shrink-0 font-medium underline underline-offset-2 hover:text-rose-950"
          >
            Cerrar
          </button>
        </div>
      )}
    </form>
  )
}
