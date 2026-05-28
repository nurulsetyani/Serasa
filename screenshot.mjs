import puppeteer from 'puppeteer'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const url   = process.argv[2] || 'http://localhost:3000'
const label = process.argv[3] || ''

const dir = './temporary screenshots'
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

// Auto-increment N
const existing = existsSync(dir)
  ? readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
  : []
const nums = existing.map(f => parseInt(f.replace('screenshot-','').split('-')[0])).filter(n => !isNaN(n))
const n = nums.length ? Math.max(...nums) + 1 : 1

const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`
const outPath  = join(dir, filename)

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
// Wait for all images to load
await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r })))
})
await new Promise(r => setTimeout(r, 3000))  // let animations settle
await page.screenshot({ path: outPath, fullPage: false })
await browser.close()

console.log(`Saved: ${outPath}`)
