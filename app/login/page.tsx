import Image from 'next/image'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Login Staf — Serasa',
}

function safeRedirect(path?: string) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/admin'
  return path
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string }
}) {
  const redirectTo = safeRedirect(searchParams.redirect)
  const hasError = searchParams.error === '1'

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: '#0F1115' }}
    >
      {/* Layered ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 -left-32 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(240,160,48,0.16) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-48 -right-32 h-[28rem] w-[28rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(240,160,48,0.10) 0%, transparent 70%)' }}
        />
      </div>

      {/* Grain texture */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]" aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div
            className="rounded-2xl bg-white/95 px-6 py-3"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
          >
            <Image src="/logo.png" alt="Serasa" width={120} height={42} style={{ objectFit: 'contain' }} priority />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border px-7 py-8"
          style={{
            background: '#171A21',
            borderColor: '#23262F',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.65), 0 0 48px -12px rgba(240,160,48,0.10)',
          }}
        >
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-white text-center">
            Login Staf
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed" style={{ color: '#A1A1AA' }}>
            Halaman ini khusus untuk staf restoran.
            <br />
            Masukkan password untuk melanjutkan.
          </p>

          <LoginForm redirectTo={redirectTo} hasError={hasError} />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#5A5A4A' }}>
          Lupa password? Hubungi developer/pengelola sistem.
        </p>
      </div>
    </div>
  )
}
