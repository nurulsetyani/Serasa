/**
 * Delivery platform status callbacks.
 *
 * Adjust BASE_URL and endpoint paths to match the exact API docs
 * provided by HungerStation and Keeta when you onboard.
 */

// ── HungerStation ─────────────────────────────────────────────────────────────

const HS_BASE = 'https://api.hungerstation.com/partner/v2'

async function hungerStationCall(path: string) {
  const res = await fetch(`${HS_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUNGERSTATION_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HungerStation API ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export async function hsAcceptOrder(platformOrderId: string) {
  return hungerStationCall(`/orders/${platformOrderId}/accept`)
}

export async function hsMarkReady(platformOrderId: string) {
  return hungerStationCall(`/orders/${platformOrderId}/ready`)
}

// ── Keeta ─────────────────────────────────────────────────────────────────────

const KEETA_BASE = 'https://api.keeta.com/merchant/v1'

async function keetaCall(path: string) {
  const res = await fetch(`${KEETA_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KEETA_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Keeta API ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export async function keetaAcceptOrder(platformOrderId: string) {
  return keetaCall(`/orders/${platformOrderId}/confirm`)
}

export async function keetaMarkReady(platformOrderId: string) {
  return keetaCall(`/orders/${platformOrderId}/ready`)
}
