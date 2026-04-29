import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const isConfigured = url.startsWith('https://') && anon.length > 10

// Browser singleton — returns a no-op stub when not configured (mock mode / build time)
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isConfigured) return createNoop()
  if (!_client) _client = createClient(url, anon, { realtime: { params: { eventsPerSecond: 10 } } })
  return _client
}

// Convenience proxy so existing code (supabase.from / supabase.channel) still works
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})

// Server-side admin client for API routes
export function createAdminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url.startsWith('https://') || !serviceKey || serviceKey === 'placeholder_service_role_key') {
    throw new Error('Supabase not configured — add env vars to Vercel dashboard')
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Stub that silently no-ops so pages don't crash when Supabase is missing
function createNoop(): SupabaseClient {
  const noop: any = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'from') return () => noop
        if (prop === 'channel') return () => noop
        if (prop === 'removeChannel') return () => {}
        if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') return () => noop
        if (prop === 'eq' || prop === 'in' || prop === 'order' || prop === 'limit') return () => noop
        if (prop === 'single') return () => Promise.resolve({ data: null, error: null })
        if (prop === 'on') return () => noop
        if (prop === 'subscribe') return () => {}
        if (prop === 'then') return undefined
        return () => Promise.resolve({ data: null, error: null })
      },
    }
  )
  return noop
}
