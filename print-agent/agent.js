/**
 * Serasa Print Agent
 * Local daemon — runs on the cashier PC, listens to Supabase Realtime,
 * prints to USB thermal printer via Windows printer driver.
 *
 * Run: node agent.js
 * Setup first: node setup.js  (converts logo to thermal format)
 */
require('dotenv').config()

const { createClient }         = require('@supabase/supabase-js')
const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer')
const { buildCashierReceipt }  = require('./receipt/cashier')
const { buildKitchenReceipt }  = require('./receipt/kitchen')

// ── Config ────────────────────────────────────────────────────
const SUPABASE_URL    = process.env.SUPABASE_URL
const SUPABASE_KEY    = process.env.SUPABASE_ANON_KEY
const PRINTER_NAME    = process.env.PRINTER_NAME    || 'Thermal Printer'
const RESTAURANT_ID   = process.env.RESTAURANT_ID   || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY are required in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Printer Factory ───────────────────────────────────────────
function createPrinter() {
  return new ThermalPrinter({
    type:      PrinterTypes.EPSON,       // works for most 80mm printers
    interface: `printer:${PRINTER_NAME}`,
    options: { timeout: 10000 },
    width:  48,                          // 48 chars for 80mm paper
    characterSet: 'PC437_USA',
    removeSpecialCharacters: false,
    lineCharacter: '-',
  })
}

// ── Process a single print job ────────────────────────────────
async function processJob(job) {
  console.log(`🖨  Processing job ${job.id} [${job.type}]`)

  // Mark as printing
  await supabase
    .from('print_jobs')
    .update({ status: 'printing' })
    .eq('id', job.id)

  const printer = createPrinter()

  // Check printer connection
  const isConnected = await printer.isPrinterConnected()
  if (!isConnected) {
    const errMsg = `Printer "${PRINTER_NAME}" not connected`
    console.error('❌', errMsg)
    await supabase
      .from('print_jobs')
      .update({ status: 'error', error_msg: errMsg })
      .eq('id', job.id)
    return
  }

  try {
    const payload = job.payload

    if (job.type === 'cashier') {
      await buildCashierReceipt(printer, payload)
    } else if (job.type === 'kitchen') {
      await buildKitchenReceipt(printer, payload)
    } else {
      throw new Error(`Unknown job type: ${job.type}`)
    }

    await printer.execute()

    await supabase
      .from('print_jobs')
      .update({ status: 'done', printed_at: new Date().toISOString() })
      .eq('id', job.id)

    console.log(`✓ Job ${job.id} printed successfully`)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`❌ Job ${job.id} failed:`, errMsg)
    await supabase
      .from('print_jobs')
      .update({ status: 'error', error_msg: errMsg })
      .eq('id', job.id)
  }
}

// ── On startup: flush any unprinted pending jobs ──────────────
async function flushPendingJobs() {
  const { data: pending } = await supabase
    .from('print_jobs')
    .select('*')
    .in('status', ['pending', 'printing']) // 'printing' = crashed mid-job
    .order('created_at', { ascending: true })
    .limit(20)

  if (pending?.length) {
    console.log(`📋 Found ${pending.length} pending job(s) — printing now...`)
    for (const job of pending) {
      await processJob(job)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║      SERASA Print Agent  v1.0            ║')
  console.log('╠══════════════════════════════════════════╣')
  console.log(`║  Printer : ${PRINTER_NAME.padEnd(30)}║`)
  console.log(`║  Supabase: ${new URL(SUPABASE_URL).hostname.slice(0,30).padEnd(30)}║`)
  console.log('╚══════════════════════════════════════════╝')
  console.log()

  // Flush any jobs that came in while agent was offline
  await flushPendingJobs()

  // Subscribe to new print jobs via Supabase Realtime
  const channel = supabase.channel('print-agent')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'print_jobs',
        filter: 'status=eq.pending',
      },
      (payload) => {
        const job = payload.new
        // Only process jobs for this restaurant
        if (RESTAURANT_ID && job.restaurant_id && job.restaurant_id !== RESTAURANT_ID) return
        processJob(job)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✓ Listening for print jobs... (Press Ctrl+C to stop)\n')
      }
    })

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\nShutting down print agent...')
    await supabase.removeChannel(channel)
    process.exit(0)
  })
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
