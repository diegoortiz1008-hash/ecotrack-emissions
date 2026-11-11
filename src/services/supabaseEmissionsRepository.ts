import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Emission, EmissionRow } from '../types'
import type { EmissionsRepository } from './emissionsRepository'

/** Mapper fila de BD (snake_case) -> dominio (camelCase). */
export const toEmission = (row: EmissionRow): Emission => ({
  id: row.id,
  sourceName: row.source_name,
  category: row.category,
  co2Kg: Number(row.co2_kg),
  createdAt: new Date(row.created_at),
})

export function createSupabaseEmissionsRepository(
  client: SupabaseClient<Database>,
): EmissionsRepository {
  return {
    source: 'supabase',

    async list() {
      const { data, error } = await client
        .from('emissions')
        .select('id, source_name, category, co2_kg, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw new Error(`No se pudieron cargar las mediciones: ${error.message}`)
      return data.map(toEmission)
    },

    async create(input) {
      const { data, error } = await client
        .from('emissions')
        .insert({
          source_name: input.sourceName.trim(),
          category: input.category,
          co2_kg: input.co2Kg,
        })
        .select('id, source_name, category, co2_kg, created_at')
        .single()
      if (error) throw new Error(`No se pudo guardar la medición: ${error.message}`)
      return toEmission(data)
    },

    subscribe(onInsert) {
      const channel = client
        .channel('emissions-inserts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'emissions' },
          (payload) => onInsert(toEmission(payload.new as EmissionRow)),
        )
        .subscribe()
      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}
