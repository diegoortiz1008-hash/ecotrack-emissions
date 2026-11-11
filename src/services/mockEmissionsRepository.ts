import type { Emission, NewEmission } from '../types'
import type { EmissionsRepository } from './emissionsRepository'

/**
 * Repositorio con datos simulados (sin Supabase).
 * Escenarios de demo por URL: ?mock=slow | ?mock=error | ?mock=empty | ?mock=insert-error
 */
export type MockScenario = 'normal' | 'slow' | 'error' | 'empty' | 'insert-error'

const SEED: readonly Emission[] = [
  { id: 'seed-1', sourceName: 'Flota de camiones Bogotá', category: 'transporte', co2Kg: 12850, createdAt: new Date('2026-11-10T08:15:00') },
  { id: 'seed-2', sourceName: 'Planta de producción Medellín', category: 'energia', co2Kg: 8420.5, createdAt: new Date('2026-11-10T07:40:00') },
  { id: 'seed-3', sourceName: 'Relleno sanitario sede norte', category: 'residuos', co2Kg: 2310, createdAt: new Date('2026-11-09T18:05:00') },
  { id: 'seed-4', sourceName: 'Vuelos corporativos Q4', category: 'transporte', co2Kg: 5640, createdAt: new Date('2026-11-09T11:30:00') },
  { id: 'seed-5', sourceName: 'Data center Cali', category: 'energia', co2Kg: 3975.25, createdAt: new Date('2026-11-08T16:20:00') },
  { id: 'seed-6', sourceName: 'Residuos electrónicos oficinas', category: 'residuos', co2Kg: 640, createdAt: new Date('2026-11-08T09:00:00') },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function createMockEmissionsRepository(scenario: MockScenario = 'normal'): EmissionsRepository {
  let store: Emission[] = scenario === 'empty' ? [] : [...SEED]
  const listeners = new Set<(e: Emission) => void>()
  const latency = scenario === 'slow' ? 60_000 : 700

  return {
    source: 'mock',

    async list() {
      await wait(latency)
      if (scenario === 'error') {
        throw new Error('No se pudieron cargar las mediciones: tiempo de espera agotado (simulado)')
      }
      return [...store]
    },

    async create(input: NewEmission) {
      await wait(600)
      if (scenario === 'insert-error') {
        throw new Error('No se pudo guardar la medición: permiso denegado por RLS (simulado)')
      }
      const emission: Emission = {
        id: crypto.randomUUID(),
        sourceName: input.sourceName.trim(),
        category: input.category,
        co2Kg: input.co2Kg,
        createdAt: new Date(),
      }
      store = [emission, ...store]
      listeners.forEach((notify) => notify(emission))
      return emission
    },

    subscribe(onInsert) {
      listeners.add(onInsert)
      return () => listeners.delete(onInsert)
    },
  }
}

export function readMockScenario(search: string): MockScenario {
  const value = new URLSearchParams(search).get('mock')
  const valid: readonly MockScenario[] = ['slow', 'error', 'empty', 'insert-error']
  return valid.find((s) => s === value) ?? 'normal'
}
