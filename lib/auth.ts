// Shared password protection for staff-only pages (/admin, /pos, /kitchen, /qr).
// Session cookie value = SHA-256 hash of STAFF_PASSWORD, so rotating the env var
// instantly invalidates every existing session.

export const STAFF_SESSION_COOKIE = 'staff_auth'
export const STAFF_SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getExpectedSessionToken(): Promise<string | null> {
  const password = process.env.STAFF_PASSWORD
  if (!password) return null
  return sha256Hex(password)
}

export function isStaffPasswordCorrect(input: string): boolean {
  const expected = process.env.STAFF_PASSWORD
  return !!expected && input === expected
}
