import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { createMockEmissionsRepository, readMockScenario } from './mockEmissionsRepository'
import { createSupabaseEmissionsRepository } from './supabaseEmissionsRepository'

export type { EmissionsRepository } from './emissionsRepository'
export { createMockEmissionsRepository } from './mockEmissionsRepository'

/** Con .env usa Supabase real; sin .env usa datos simulados. */
export const emissionsRepository =
  isSupabaseConfigured && supabase
    ? createSupabaseEmissionsRepository(supabase)
    : createMockEmissionsRepository(readMockScenario(window.location.search))
