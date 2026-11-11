import type { Emission, NewEmission } from '../types'

/**
 * Contrato de acceso a datos. El hook depende de esta interfaz y no de
 * Supabase directamente: así se puede usar un mock en demos y pruebas.
 */
export interface EmissionsRepository {
  readonly source: 'supabase' | 'mock'
  list(): Promise<Emission[]>
  create(input: NewEmission): Promise<Emission>
  /** Suscripción a inserciones en tiempo real. Devuelve la función para cancelar. */
  subscribe(onInsert: (emission: Emission) => void): () => void
}
