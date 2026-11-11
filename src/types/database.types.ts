/**
 * Tipos de la tabla `emissions` en Supabase.
 * Se pueden regenerar con: npx supabase gen types typescript --linked
 */
export type Database = {
  public: {
    Tables: {
      emissions: {
        Row: {
          id: string
          source_name: string
          category: 'transporte' | 'energia' | 'residuos'
          co2_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          source_name: string
          category: 'transporte' | 'energia' | 'residuos'
          co2_kg: number
          created_at?: string
        }
        Update: {
          id?: string
          source_name?: string
          category?: 'transporte' | 'energia' | 'residuos'
          co2_kg?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type EmissionRow = Database['public']['Tables']['emissions']['Row']
