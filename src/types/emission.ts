/** Categorías permitidas por la especificación. */
export const EMISSION_CATEGORIES = ['transporte', 'energia', 'residuos'] as const

export type EmissionCategory = (typeof EMISSION_CATEGORIES)[number]

/** Modelo de dominio que consume la UI (camelCase). */
export interface Emission {
  readonly id: string
  readonly sourceName: string
  readonly category: EmissionCategory
  readonly co2Kg: number
  readonly createdAt: Date
}

/** Datos que envía el formulario para crear una medición. */
export type NewEmission = Pick<Emission, 'sourceName' | 'category' | 'co2Kg'>

export const isEmissionCategory = (value: string): value is EmissionCategory =>
  (EMISSION_CATEGORIES as readonly string[]).includes(value)
