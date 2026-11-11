import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0

/**
 * Cliente ÚNICO de Supabase. Es `null` cuando no hay variables de entorno:
 * en ese caso la app usa el repositorio de datos simulados.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url, anonKey)
  : null
