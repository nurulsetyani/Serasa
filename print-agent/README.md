# Serasa Print Agent

Local daemon that listens to Supabase Realtime and prints to a USB thermal printer.

## Architecture

```
Vercel (Next.js) → POST /api/print → inserts print_jobs row
                                          ↓
                              Supabase Realtime (INSERT event)
                                          ↓
                              agent.js (runs on cashier PC)
                                          ↓
                              USB Thermal Printer (80mm)
```

## Prerequisites

- Node.js 18+
- Windows 10/11 with thermal printer installed (any brand supported by Windows printer driver)
- USB thermal printer set up as a Windows printer (Settings → Printers & scanners)

## Setup

### 1. Install dependencies

```bash
cd print-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PRINTER_NAME=Thermal Printer          # must match Windows printer name exactly
RESTAURANT_ID=                        # optional, leave blank for single-restaurant setups
APP_URL=https://serasa-opal.vercel.app
```

To find the exact Windows printer name:
- Open **Settings → Bluetooth & devices → Printers & scanners**
- Copy the printer name exactly as shown

### 3. Prepare logo

```bash
node setup.js
```

This converts `../Asset/logof22.png` to `assets/logo-thermal.png` (grayscale, binarized for thermal printing).

### 4. Run the Supabase migration

Run this SQL in Supabase SQL Editor:

```sql
-- File: ../supabase/migrations/print_jobs.sql
```

Or copy-paste the content of `../supabase/migrations/print_jobs.sql` directly.

### 5. Start the agent

```bash
node agent.js
```

You should see:
```
╔══════════════════════════════════════════╗
║      SERASA Print Agent  v1.0            ║
╠══════════════════════════════════════════╣
║  Printer : Thermal Printer               ║
║  Supabase: xxxx.supabase.co              ║
╚══════════════════════════════════════════╝

✓ Listening for print jobs... (Press Ctrl+C to stop)
```

## Auto-start on Windows

To run the agent automatically when the PC starts:

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a new shortcut in the Startup folder
3. Set target to: `node "C:\path\to\print-agent\agent.js"`
4. Or use a `.bat` file:

```bat
@echo off
cd /d C:\path\to\print-agent
node agent.js
pause
```

## What gets printed

| Event | Print job type | Content |
|-------|---------------|---------|
| POS order confirmed | `cashier` | Full receipt: logo, items, totals, QR code |
| Any new order | `kitchen` | Minimal: table number (large), items + notes |

## Troubleshooting

**Printer not connected**: Verify the printer name in `.env` matches exactly. Check Windows printer queue is not paused.

**Jobs stuck in `printing`**: The agent crashed mid-job. On restart, it automatically re-processes stuck jobs.

**Arabic text not printing**: Most 80mm printers don't support Arabic codepage. The text may render as `???`. Full Arabic image support requires adding `@napi-rs/canvas` — see `receipt/cashier.js` for the enhancement note.

**Offline jobs**: Any print jobs created while the agent is offline are flushed automatically on the next startup.
