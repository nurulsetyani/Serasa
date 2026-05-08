'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const APP_URL     = 'https://serasa-opal.vercel.app'
const TOTAL_TABLES = 8
const P = '#FF6B35'

// Generate QR as data URL using qrcode library (client-side, no external API)
async function generateQR(text: string): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(text, {
    width: 240,
    margin: 2,
    color: { dark: '#1A1208', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })
}

function QRCard({ table, baseUrl }: { table: number; baseUrl: string }) {
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [error, setError]  = useState(false)

  useEffect(() => {
    const url = `${baseUrl}/?table=${table}`
    generateQR(url)
      .then(src => setQrSrc(src))
      .catch(() => setError(true))
  }, [table, baseUrl])

  return (
    <div className="qr-card">
      {/* Header — logo */}
      <div className="qr-card-header">
        <div className="flex justify-center mb-2">
          <div style={{ position: 'relative', width: 140, height: 50 }}>
            <Image
              src="/logo.png"
              alt="Serasa Restaurant"
              fill
              className="object-contain"
              sizes="140px"
            />
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#9A8A7A', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
          Scan to Order
        </p>
      </div>

      {/* QR Code */}
      <div className="qr-image-wrap">
        {error ? (
          <div style={{ width: 200, height: 200, background: '#F5F0EC', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8A7A', fontSize: 12 }}>
            QR Error
          </div>
        ) : qrSrc ? (
          <img src={qrSrc} alt={`QR Meja ${table}`} width={200} height={200} className="qr-image"
            style={{ borderRadius: 8 }} />
        ) : (
          <div style={{ width: 200, height: 200, background: '#F5F0EC', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #E8D8C8',
              borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Footer — table number */}
      <div className="qr-card-footer">
        <div className="table-badge">
          <span style={{ fontSize: 24, fontWeight: 900, color: '#1A1208' }}>{table}</span>
        </div>
        <p style={{ fontSize: 10, color: '#9A8A7A', marginTop: 6, letterSpacing: '1px' }}>
          Meja / Table / طاولة
        </p>
      </div>
    </div>
  )
}

export default function QRPage() {
  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1)
  const [customUrl, setCustomUrl] = useState(APP_URL)
  const [appliedUrl, setAppliedUrl] = useState(APP_URL)

  return (
    <div className="min-h-screen p-6" style={{ background: '#FAFAF8' }} dir="ltr">

      {/* Header */}
      <div className="no-print mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">QR Code Generator</h1>
          <p className="text-gray-400 text-sm mt-1">Print & pasang di setiap meja restoran</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
          style={{ background: P, boxShadow: `0 4px 16px rgba(255,107,53,0.35)` }}>
          🖨️ Print Semua
        </button>
      </div>

      {/* URL customizer */}
      <div className="no-print mb-6 bg-white rounded-2xl p-4 max-w-xl"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}>
        <label className="text-xs font-black tracking-[2px] uppercase text-gray-400 mb-2 block">
          URL App
        </label>
        <div className="flex gap-2">
          <input type="url" value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400"
            style={{ background: '#FAFAF8' }} />
          <button onClick={() => setAppliedUrl(customUrl)}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: P }}>
            Terapkan
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Contoh: {APP_URL}
        </p>
      </div>

      {/* QR Grid */}
      <div className="qr-grid">
        {tables.map(table => (
          <QRCard key={`${table}-${appliedUrl}`} table={table} baseUrl={appliedUrl} />
        ))}
      </div>

      {/* Print tips */}
      <div className="no-print mt-8 bg-white rounded-2xl p-5 max-w-lg mx-auto text-center"
        style={{ border: '1px solid #F0EAE0' }}>
        <p className="font-bold text-gray-900 mb-2" style={{ color: P }}>📄 Tips Print</p>
        <ul className="text-gray-500 text-sm space-y-1 text-left">
          <li>• Kertas: <strong className="text-gray-800">A4</strong>, Layout: <strong className="text-gray-800">Portrait</strong></li>
          <li>• Margins: <strong className="text-gray-800">None / Minimum</strong></li>
          <li>• Centang <strong className="text-gray-800">Background graphics</strong></li>
          <li>• Laminating untuk ketahanan lebih lama</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .qr-card { break-inside: avoid; page-break-inside: avoid; }
        }

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 20px;
          max-width: 960px;
          margin: 0 auto;
        }

        .qr-card {
          background: white;
          border: 1.5px solid #F0EAE0;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        }

        .qr-card-header {
          background: #1A1208;
          width: 100%;
          padding: 16px 16px 12px;
          text-align: center;
        }

        .qr-image-wrap {
          padding: 16px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .qr-image {
          width: 200px;
          height: 200px;
          display: block;
        }

        .qr-card-footer {
          background: #FAFAF8;
          border-top: 1px solid #F0EAE0;
          width: 100%;
          padding: 12px 16px 14px;
          text-align: center;
        }

        .table-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: ${P};
          color: white;
          margin: 0 auto;
          box-shadow: 0 4px 12px rgba(255,107,53,0.35);
        }
      `}</style>
    </div>
  )
}
