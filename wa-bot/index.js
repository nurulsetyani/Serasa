const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} = require('@whiskeysockets/baileys')
const express = require('express')
const QRCode  = require('qrcode')
const P       = require('pino')

const app = express()
app.use(express.json())

const BOT_SECRET = process.env.BOT_SECRET || 'ganti-ini-dengan-password-rahasia'
const PORT       = process.env.PORT || 3001

let sock        = null
let isConnected = false
let currentQR   = null  // QR string terbaru dari Baileys

// ── WhatsApp Connection ────────────────────────────────────────
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

  sock = makeWASocket({
    auth:               state,
    printQRInTerminal:  false,
    browser:            Browsers.macOS('Chrome'),
    logger:             P({ level: 'silent' }),
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      currentQR = qr
      console.log('[WA] QR baru tersedia → buka /qr di browser untuk scan')
    }

    if (connection === 'close') {
      isConnected = false
      const code          = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(`[WA] Koneksi putus (code: ${code}), reconnect: ${shouldReconnect}`)
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 3000)
      } else {
        console.log('[WA] Logged out. Hapus folder auth_info_baileys dan restart.')
      }
    } else if (connection === 'open') {
      currentQR   = null
      isConnected = true
      console.log('[WA] ✅ WhatsApp terhubung!')
    }
  })
}

// ── Routes ─────────────────────────────────────────────────────

// Halaman utama + health — UptimeRobot ping ke sini
app.get('/', (req, res) => {
  res.json({
    service:   'Serasa WA Bot',
    connected: isConnected,
    status:    isConnected ? '✅ Online' : '⏳ Menunggu scan QR',
  })
})

// Halaman scan QR — buka di browser HP untuk scan
app.get('/qr', async (req, res) => {
  if (isConnected) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f0fff4">
        <h2>✅ WhatsApp Terhubung!</h2>
        <p style="color:#16a34a">Bot aktif dan siap kirim notifikasi ke owner.</p>
        <p style="color:#888;font-size:13px">Halaman ini otomatis refresh setiap 10 detik.</p>
        <script>setTimeout(()=>location.reload(), 10000)</script>
      </body></html>
    `)
  }

  if (!currentQR) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#fffbeb">
        <h2>⏳ Menunggu QR...</h2>
        <p>Bot sedang inisialisasi. Refresh otomatis dalam 5 detik.</p>
        <script>setTimeout(()=>location.reload(), 5000)</script>
      </body></html>
    `)
  }

  try {
    const qrImage = await QRCode.toDataURL(currentQR, { width: 280, margin: 2 })
    res.send(`
      <html>
      <head><title>Serasa WA Bot — Scan QR</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5">
        <h2 style="color:#1a1a1a">📱 Scan QR WhatsApp</h2>
        <p style="color:#555">WhatsApp → Linked Devices → Link a Device → Scan QR ini</p>
        <div style="display:inline-block;background:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12)">
          <img src="${qrImage}" style="display:block;width:280px;height:280px" />
        </div>
        <p style="color:#f59e0b;font-size:13px;margin-top:16px">⚠️ QR expire dalam ~60 detik. Halaman ini auto-refresh setiap 45 detik.</p>
        <script>setTimeout(()=>location.reload(), 45000)</script>
      </body>
      </html>
    `)
  } catch (err) {
    res.send('<h2>Error generate QR. Coba refresh.</h2>')
  }
})

// Kirim pesan — dipanggil oleh Next.js (Vercel)
app.post('/send', (req, res) => {
  if (req.headers['x-bot-secret'] !== BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!isConnected || !sock) {
    return res.status(503).json({ error: 'WhatsApp belum terhubung. Scan QR dulu di /qr' })
  }

  const { phone, message } = req.body
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone dan message wajib diisi' })
  }

  const jid = phone.includes('@')
    ? phone
    : `${phone.replace(/\D/g, '')}@s.whatsapp.net`

  sock.sendMessage(jid, { text: message })
    .then(() => res.json({ ok: true }))
    .catch(err => {
      console.error('[WA] sendMessage error:', err)
      res.status(500).json({ error: String(err) })
    })
})

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[WA] Serasa WA Bot berjalan di port ${PORT}`)
  connectToWhatsApp()
})
