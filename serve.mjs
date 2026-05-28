// Simple static file server — not used for Next.js projects.
// Next.js uses `npm run dev` or `npm run start` instead.
// This file exists for CLAUDE.md compatibility.
import { createServer } from 'http'
import { readFile, stat } from 'fs/promises'
import { extname, join, resolve } from 'path'

const PORT = process.env.PORT || 3001
const ROOT = process.cwd()

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0])
  if (path === '/') path = '/index.html'
  const full = resolve(join(ROOT, path))
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end(); return }
  try {
    await stat(full)
    const buf = await readFile(full)
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' })
    res.end(buf)
  } catch {
    res.writeHead(404); res.end('Not found')
  }
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`))
