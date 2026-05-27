// Shared in-memory store for Tap charge status.
// Resets on cold start — use Redis/Supabase for production persistence.

type ChargeStatus = 'INITIATED' | 'CAPTURED' | 'DECLINED' | 'CANCELLED' | 'FAILED'

interface ChargeRecord {
  status: ChargeStatus
  amount: number
  currency: string
  updatedAt: string
}

// Module-level singleton — shared within the same server instance
export const tapChargeStore = new Map<string, ChargeRecord>()
