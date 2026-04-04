# RetailOS Print Server

Local ESC/POS print server for thermal receipt printers.

## Quick Start

```bash
cd packages/print-server
pnpm install
pnpm dev
```

The server runs on `http://localhost:9100`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/status` | Check printer connection status |
| POST | `/print` | Print a receipt (JSON body) |
| POST | `/test` | Print a test page |

## Supported Printers

Any ESC/POS compatible USB thermal printer:
- Epson TM-T82 / TM-T88
- Star TSP143 / TSP654
- Generic 58mm/80mm USB thermal printers

## Configuration

Set `PRINT_PORT` environment variable to change the port (default: 9100).

## Admin Setup

1. In the admin dashboard, go to **Settings → Receipt**
2. Set **Print Mode** to "ESC/POS" or "Both"
3. Set **Print Server URL** to `http://localhost:9100`
4. Click **Test Print** to verify connection
