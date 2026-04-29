'use client'

import { useState } from 'react'

const APP_URL = 'https://serasa-opal.vercel.app'
const TOTAL_TABLES = 8

function qrUrl(table: number, size = 280) {
  const target = `${APP_URL}/?table=${table}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}&bgcolor=0D0D0D&color=D4AF37&qzone=2`
}

export default function QRPage() {
  const [tables] = useState(() => Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1))
  const [customUrl, setCustomUrl] = useState(APP_URL)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen bg-obsidian p-6" dir="ltr">
      {/* Header — hidden on print */}
      <div className="no-print mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold">QR Code Generator</h1>
          <p className="text-ink-muted mt-1">Print & pasang di setiap meja restoran</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="btn-gold px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            🖨️ Print Semua
          </button>
        </div>
      </div>

      {/* URL customizer — hidden on print */}
      <div className="no-print mb-8 card-dark p-4 rounded-2xl max-w-xl">
        <label className="text-sm text-ink-muted mb-2 block font-semibold">URL App (ganti jika domain custom)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            className="input-dark flex-1 px-4 py-2 text-sm rounded-xl"
          />
        </div>
        <p className="text-xs text-ink-faint mt-2">
          Contoh: https://serasa-opal.vercel.app atau https://menu.serasa.com
        </p>
      </div>

      {/* QR Grid */}
      <div className="qr-grid">
        {tables.map(table => {
          const url = `${customUrl}/?table=${table}`
          const qr = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&qzone=2`

          return (
            <div key={table} className="qr-card">
              {/* Card top decoration */}
              <div className="qr-card-header">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-gold text-lg">🌿</span>
                  <span className="font-display font-bold text-xl tracking-wide text-obsidian">SERASA</span>
                </div>
                <p className="text-[11px] text-gray-500 tracking-widest uppercase">Indonesian Restaurant</p>
              </div>

              {/* QR Code */}
              <div className="qr-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`QR Meja ${table}`}
                  width={200}
                  height={200}
                  className="qr-image"
                />
              </div>

              {/* Table number */}
              <div className="qr-card-footer">
                <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Scan to Order</p>
                <div className="table-badge">
                  <span className="text-2xl font-display font-bold">{table}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Meja / Table / طاولة</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Print instructions — hidden on print */}
      <div className="no-print mt-8 card-dark p-5 rounded-2xl max-w-lg mx-auto text-center">
        <p className="text-gold font-semibold mb-2">📄 Tips Print</p>
        <ul className="text-ink-muted text-sm space-y-1 text-left">
          <li>• Pilih ukuran kertas <strong className="text-ink">A4</strong></li>
          <li>• Layout: <strong className="text-ink">Portrait</strong></li>
          <li>• Margins: <strong className="text-ink">None / Minimum</strong></li>
          <li>• Centang <strong className="text-ink">Background graphics</strong></li>
          <li>• Laminating untuk ketahanan lebih lama</li>
        </ul>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0 !important;
          }
          .qr-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 2px solid #D4AF37 !important;
            margin: 8px !important;
          }
        }

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .qr-card {
          background: white;
          border: 2px solid #D4AF37;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .qr-card-header {
          background: #0D0D0D;
          width: 100%;
          padding: 16px 12px 12px;
          text-align: center;
          border-bottom: 1px solid #D4AF37;
        }

        .qr-image-wrap {
          padding: 20px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-image {
          width: 200px;
          height: 200px;
          display: block;
        }

        .qr-card-footer {
          background: #0D0D0D;
          width: 100%;
          padding: 12px;
          text-align: center;
          border-top: 1px solid #D4AF37;
        }

        .table-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #D4AF37;
          color: #0D0D0D;
          margin: 4px auto;
        }
      `}</style>
    </div>
  )
}
