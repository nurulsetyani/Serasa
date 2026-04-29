import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Treat placeholder / missing values as unconfigured
export const IS_SUPABASE_CONFIGURED =
  url.startsWith('https://') &&
  !url.includes('placeholder') &&
  anon.length > 20 &&
  !anon.includes('placeholder')

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!IS_SUPABASE_CONFIGURED) return createNoop()
  if (!_client) _client = createClient(url, anon, { realtime: { params: { eventsPerSecond: 10 } } })
  return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})

export function createAdminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!IS_SUPABASE_CONFIGURED || !serviceKey || serviceKey.includes('placeholder')) {
    throw new Error('Supabase not configured')
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Promise-based noop — every chain resolves to { data: [], error: null }
function createNoop(): SupabaseClient {
  function makeChain(): any {
    const resolved = Promise.resolve({ data: [] as any[], error: null })
    return new Proxy(resolved, {
      get(target, prop: string) {
        // Pass through real Promise methods so await works correctly
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return (target as any)[prop].bind(target)
        }
        // channel/realtime stubs
        if (prop === 'on') return () => makeChain()
        if (prop === 'subscribe') return () => {}
        if (prop === 'removeChannel') return () => {}
        // Every other method (from, select, eq, order, limit, etc.) returns a new chain
        return (..._args: any[]) => makeChain()
      },
    })
  }
  return makeChain() as unknown as SupabaseClient
}
