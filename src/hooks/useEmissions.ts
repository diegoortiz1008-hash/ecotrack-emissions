import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { emissionsRepository, type EmissionsRepository } from '../services'
import { EMISSION_CATEGORIES, type Emission, type EmissionCategory, type NewEmission } from '../types'
import { toErrorMessage } from '../utils/format'

// ---------- Estado (máquina de estados explícita con useReducer) ----------
type LoadStatus = 'loading' | 'success' | 'error'

interface EmissionsState {
  emissions: Emission[]
  status: LoadStatus
  error: string | null
  isSubmitting: boolean
  submitError: string | null
}

type EmissionsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; emissions: Emission[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; emission: Emission }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'REALTIME_INSERT'; emission: Emission }
  | { type: 'CLEAR_SUBMIT_ERROR' }

const initialState: EmissionsState = {
  emissions: [],
  status: 'loading',
  error: null,
  isSubmitting: false,
  submitError: null,
}

/** Inserta al inicio evitando duplicados (la misma fila llega por insert y por Realtime). */
const prependUnique = (list: Emission[], item: Emission): Emission[] =>
  list.some((e) => e.id === item.id) ? list : [item, ...list]

export function emissionsReducer(state: EmissionsState, action: EmissionsAction): EmissionsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null }
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', emissions: action.emissions }
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, submitError: null }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, emissions: prependUnique(state.emissions, action.emission) }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, submitError: action.error }
    case 'REALTIME_INSERT':
      return { ...state, emissions: prependUnique(state.emissions, action.emission) }
    case 'CLEAR_SUBMIT_ERROR':
      return { ...state, submitError: null }
  }
}

// ---------- Hook público ----------
export interface EmissionsTotals {
  totalKg: number
  byCategory: Record<EmissionCategory, number>
}

export interface UseEmissionsResult extends EmissionsState {
  totals: EmissionsTotals
  dataSource: EmissionsRepository['source']
  addEmission: (input: NewEmission) => Promise<boolean>
  retry: () => void
  clearSubmitError: () => void
}

/**
 * Gestiona carga, inserción, errores y tiempo real de las emisiones.
 * Recibe el repositorio por parámetro (inyección de dependencias) para poder
 * probarlo con un mock sin tocar Supabase.
 */
export function useEmissions(repository: EmissionsRepository = emissionsRepository): UseEmissionsResult {
  const [state, dispatch] = useReducer(emissionsReducer, initialState)
  const [reloadToken, setReloadToken] = useState(0)

  // Carga inicial y reintentos. `active` evita actualizar estado tras desmontar.
  useEffect(() => {
    let active = true
    repository
      .list()
      .then((emissions) => {
        if (active) dispatch({ type: 'FETCH_SUCCESS', emissions })
      })
      .catch((error: unknown) => {
        if (active) dispatch({ type: 'FETCH_ERROR', error: toErrorMessage(error) })
      })
    return () => {
      active = false
    }
  }, [repository, reloadToken])

  // Tiempo real: nuevas mediciones de otros usuarios aparecen sin recargar.
  useEffect(
    () => repository.subscribe((emission) => dispatch({ type: 'REALTIME_INSERT', emission })),
    [repository],
  )

  const retry = useCallback(() => {
    dispatch({ type: 'FETCH_START' })
    setReloadToken((t) => t + 1)
  }, [])

  const addEmission = useCallback(
    async (input: NewEmission): Promise<boolean> => {
      dispatch({ type: 'SUBMIT_START' })
      try {
        const emission = await repository.create(input)
        dispatch({ type: 'SUBMIT_SUCCESS', emission })
        return true
      } catch (error) {
        dispatch({ type: 'SUBMIT_ERROR', error: toErrorMessage(error) })
        return false
      }
    },
    [repository],
  )

  const clearSubmitError = useCallback(() => dispatch({ type: 'CLEAR_SUBMIT_ERROR' }), [])

  // Totales derivados: solo se recalculan cuando cambia la lista.
  const totals = useMemo<EmissionsTotals>(() => {
    const byCategory = Object.fromEntries(EMISSION_CATEGORIES.map((c) => [c, 0])) as Record<
      EmissionCategory,
      number
    >
    let totalKg = 0
    for (const e of state.emissions) {
      byCategory[e.category] += e.co2Kg
      totalKg += e.co2Kg
    }
    return { totalKg, byCategory }
  }, [state.emissions])

  return { ...state, totals, dataSource: repository.source, addEmission, retry, clearSubmitError }
}
