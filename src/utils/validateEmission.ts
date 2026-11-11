import { isEmissionCategory, type EmissionCategory, type NewEmission } from '../types'

export interface FormValues {
  sourceName: string
  category: EmissionCategory | ''
  co2Kg: string
}

export type FieldErrors = Partial<Record<keyof FormValues, string>>

export const EMPTY_FORM: FormValues = { sourceName: '', category: '', co2Kg: '' }
const MAX_CO2_KG = 1_000_000

/** Validación pura: devuelve los errores o el objeto listo para enviar. */
export function validateEmission(values: FormValues): { errors: FieldErrors; data?: NewEmission } {
  const errors: FieldErrors = {}
  const name = values.sourceName.trim()
  const co2 = Number(values.co2Kg.replace(',', '.'))

  if (name.length < 3) errors.sourceName = 'Escribe al menos 3 caracteres.'
  else if (name.length > 80) errors.sourceName = 'Máximo 80 caracteres.'

  if (!isEmissionCategory(values.category)) errors.category = 'Selecciona una categoría.'

  if (values.co2Kg.trim() === '' || Number.isNaN(co2)) errors.co2Kg = 'Ingresa un número.'
  else if (co2 <= 0) errors.co2Kg = 'Debe ser mayor que 0.'
  else if (co2 > MAX_CO2_KG) errors.co2Kg = 'Máximo 1.000.000 kg por medición.'

  if (Object.keys(errors).length > 0 || !isEmissionCategory(values.category)) return { errors }
  return { errors, data: { sourceName: name, category: values.category, co2Kg: co2 } }
}
