/**
 * Run once: node setup.js
 * Converts the restaurant logo to grayscale PNG suitable for thermal printing.
 */
const Jimp = require('jimp')
const path = require('path')
const fs   = require('fs')

const SRC  = path.join(__dirname, '..', 'Asset', 'logof22.png')
const DEST = path.join(__dirname, 'assets', 'logo-thermal.png')

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Logo not found at:', SRC)
    process.exit(1)
  }

  console.log('Converting logo for thermal printing...')
  const img = await Jimp.read(SRC)

  img
    .resize(400, Jimp.AUTO)       // max 400px wide (fits 80mm paper)
    .greyscale()                   // convert to grayscale
    .contrast(0.3)                 // increase contrast for B&W thermal
    .threshold({ max: 180 })       // binarize: pixel > 180 = white, else = black

  await img.writeAsync(DEST)
  console.log('✓ Logo saved to:', DEST)
  console.log('✓ Setup complete. Run: node agent.js')
}

main().catch(err => { console.error(err); process.exit(1) })
