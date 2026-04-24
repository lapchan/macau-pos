# Network Printer — Implementation Blueprint (Phase B)

| Field | Value |
|---|---|
| **Module** | Network Printer |
| **Phase** | B — Implementation Blueprint |
| **Persona** | 🎭 Backend Architect + DB Optimizer |
| **Date** | 2026-04-24 |
| **Planning** | `docs/01-planning/PLANNING_NETWORK_PRINTER.md` (Phases 0–4 signed off) |
| **Phase A** | `PLAN-12-network-printer-PHASE-A.md` (signed off) |
| **Status** | Awaiting sign-off to proceed to Phase C (Test Plan) |

> **How to use this doc:** every file listed has its exact path, purpose, public signature, and acceptance criteria. A developer picking this up cold should be able to code each sub-phase (A–P per planning §15) without rereading the planning doc, but can cross-reference it for rationale.

---

## 1. Monorepo impact map

### 1.1 New packages

```
packages/
├── escpos-shared/           [NEW]  @macau-pos/escpos-shared — pure TS, zero deps
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── drivers/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── generic.ts
│   │   │   ├── star.ts
│   │   │   └── epson.ts
│   │   ├── codepages/
│   │   │   ├── index.ts
│   │   │   ├── cp437.ts
│   │   │   ├── gb18030.ts
│   │   │   ├── big5.ts
│   │   │   └── shift-jis.ts
│   │   ├── builder/
│   │   │   ├── index.ts
│   │   │   ├── build-receipt.ts
│   │   │   ├── build-test-page.ts
│   │   │   └── commands.ts
│   │   └── types.ts
│   └── tests/
│       ├── byte-parity.test.ts
│       ├── driver-generic.test.ts
│       ├── driver-star.test.ts
│       ├── driver-epson.test.ts
│       └── codepages.test.ts
│
└── print-server/            [REWRITTEN]  @macau-pos/printer-bridge — published to npm
    ├── package.json         (replaces existing)
    ├── tsconfig.json
    ├── bin/
    │   └── printer-bridge.ts
    ├── src/
    │   ├── daemon.ts
    │   ├── config.ts
    │   ├── bootstrap.ts
    │   ├── handlers/
    │   │   ├── print.ts
    │   │   ├── test.ts
    │   │   ├── health.ts
    │   │   └── version.ts
    │   ├── middleware/
    │   │   ├── bearer-auth.ts
    │   │   ├── rate-limit.ts
    │   │   ├── idempotency.ts
    │   │   └── logging.ts
    │   ├── transport/
    │   │   ├── adapter.ts
    │   │   ├── linux-lp.ts
    │   │   ├── node-usb.ts
    │   │   ├── cups.ts
    │   │   └── detect.ts
    │   ├── commands/
    │   │   ├── apply.ts
    │   │   ├── rotate-token.ts
    │   │   ├── force-update.ts
    │   │   └── reload-config.ts
    │   ├── self-update.ts
    │   ├── heartbeat.ts
    │   ├── update-check.ts
    │   └── test-page.ts
    ├── install/
    │   ├── install.sh
    │   ├── linux-systemd.sh
    │   ├── macos-launchd.sh
    │   ├── openwrt-procd.sh
    │   ├── windows-nssm.ps1
    │   ├── uninstall.sh
    │   └── README.md
    └── tests/
        ├── unit/
        │   ├── bearer-auth.test.ts
        │   ├── idempotency.test.ts
        │   ├── rate-limit.test.ts
        │   └── transports.test.ts
        └── integration/
            ├── round-trip.test.ts
            └── byte-parity-bridge.test.ts
```

### 1.2 Changes to existing apps

```
packages/database/
├── src/schema/
│   └── location-printer-settings.ts    [NEW]
├── drizzle/
│   └── 0006_add_location_printer_settings.sql    [NEW]
└── src/schema/index.ts    [EDITED]  add re-export

apps/admin/src/
├── app/(dashboard)/locations/[id]/
│   ├── page.tsx                         [EDITED]  add "Printer" tab link
│   └── printer/
│       ├── page.tsx                     [NEW]
│       ├── printer-form.tsx             [NEW]
│       ├── printer-provision-panel.tsx  [NEW]
│       ├── token-rotate-dialog.tsx      [NEW]
│       ├── test-print-button.tsx        [NEW]
│       ├── status-card.tsx              [NEW]
│       └── migrate-bridge-dialog.tsx    [NEW]
├── app/(dashboard)/printers/
│   └── page.tsx                         [NEW]  fleet dashboard
├── app/api/printers/
│   ├── heartbeat/route.ts               [NEW]
│   └── bootstrap/route.ts               [NEW]
├── lib/
│   ├── printer-actions.ts               [NEW]  all 9 server actions
│   ├── printer-hash.ts                  [NEW]  hashToken, verifyToken
│   ├── printer-cf.ts                    [NEW]  CF API wrapper
│   └── printer-jwt.ts                   [NEW]  bootstrap JWT signer/verifier
├── lib/fleet-alert-job.ts               [NEW]  stale-heartbeat alerting
└── i18n/locales.ts                      [EDITED]  +13 keys × 2 locales

apps/cashier/src/
├── lib/
│   ├── printer.ts                       [NEW]  sendPrintJob, fallbackIframePrint
│   └── escpos/
│       ├── build-receipt.ts             [NEW]  wraps @macau-pos/escpos-shared
│       └── build-test-page.ts           [NEW]
├── contexts/
│   └── printer-context.tsx              [NEW]  PrinterContextProvider + usePrinter()
├── components/
│   ├── receipt/
│   │   └── print-receipt.tsx            [EDITED]  branches: network vs iframe
│   └── shared/
│       └── printer-toast.tsx            [NEW]  typed toast helpers
├── app/pos-client.tsx                   [EDITED]  wrap in <PrinterContextProvider>
└── i18n/locales.ts                      [EDITED]  +11 keys × 5 locales
```

### 1.3 Deleted or frozen

- `packages/print-server/src/printer.ts` — **extracted** to `@macau-pos/escpos-shared/src/builder/build-receipt.ts`. After extraction, the original is deleted.
- `packages/print-server/src/server.ts` — **rewritten** into the new daemon structure above.
- `shop_settings.print_mode` / `shop_settings.print_server_url` — **left in place, marked deprecated**; no code reads them.

---

## 2. Database

### 2.1 Migration `0006_add_location_printer_settings.sql`

Save to: `packages/database/drizzle/0006_add_location_printer_settings.sql`

```sql
-- Migration: 0006_add_location_printer_settings
-- Module: Network Printer
-- Adds per-location printer settings + ephemeral status tracking

-- 1. Enum types
CREATE TYPE printer_driver AS ENUM (
  'generic',
  'star',
  'epson',
  'custom'
);

CREATE TYPE printer_code_page AS ENUM (
  'cp437',
  'gb18030',
  'big5',
  'shift_jis'
);

CREATE TYPE printer_status AS ENUM (
  'ok',
  'offline',
  'out_of_paper',
  'error',
  'unknown'
);

CREATE TYPE printer_location_status AS ENUM (
  'disabled',
  'enabled',
  'maintenance'
);

-- 2. Table
CREATE TABLE location_printer_settings (
  location_id UUID PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  status printer_location_status NOT NULL DEFAULT 'disabled',
  endpoint_url TEXT NOT NULL,
  tunnel_id TEXT NOT NULL,
  driver printer_driver NOT NULL DEFAULT 'generic',
  paper_width SMALLINT NOT NULL DEFAULT 80 CHECK (paper_width IN (58, 80)),
  code_page printer_code_page NOT NULL DEFAULT 'big5',
  default_copies SMALLINT NOT NULL DEFAULT 1 CHECK (default_copies BETWEEN 1 AND 10),
  cash_drawer_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Auth: HMAC-SHA256(pepper, raw_token), hex-encoded (64 chars)
  token_hash TEXT NOT NULL,
  pending_token_hash TEXT,
  rotation_overlap_until TIMESTAMPTZ,
  pending_command_type TEXT CHECK (pending_command_type IN ('rotate_token', 'force_update', 'reload_config')),
  pending_command_payload JSONB,
  token_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bootstrap_used BOOLEAN NOT NULL DEFAULT FALSE,

  -- Ephemeral state (updated by heartbeats)
  last_seen_at TIMESTAMPTZ,
  bridge_version TEXT,
  printer_status printer_status NOT NULL DEFAULT 'unknown',
  last_error TEXT,
  last_printer_model TEXT,
  jobs_served_total INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX location_printer_offline_idx
  ON location_printer_settings (last_seen_at)
  WHERE status = 'enabled';

CREATE INDEX location_printer_status_idx
  ON location_printer_settings (status);

CREATE INDEX location_printer_stale_idx
  ON location_printer_settings (last_seen_at)
  WHERE status = 'enabled';

-- 4. Updated-at trigger (convention: trigger_set_timestamp exists in repo)
CREATE TRIGGER update_location_printer_settings_updated_at
  BEFORE UPDATE ON location_printer_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
```

### 2.2 Drizzle schema file

Save to: `packages/database/src/schema/location-printer-settings.ts`

```ts
import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, text, smallint, boolean, timestamp,
  pgEnum, index, integer, jsonb,
} from 'drizzle-orm/pg-core';
import { locations } from './locations';

export const printerDriverEnum = pgEnum('printer_driver', [
  'generic', 'star', 'epson', 'custom',
]);

export const printerCodePageEnum = pgEnum('printer_code_page', [
  'cp437', 'gb18030', 'big5', 'shift_jis',
]);

export const printerStatusEnum = pgEnum('printer_status', [
  'ok', 'offline', 'out_of_paper', 'error', 'unknown',
]);

export const printerLocationStatusEnum = pgEnum('printer_location_status', [
  'disabled', 'enabled', 'maintenance',
]);

export const locationPrinterSettings = pgTable(
  'location_printer_settings',
  {
    locationId: uuid('location_id')
      .primaryKey()
      .references(() => locations.id, { onDelete: 'cascade' }),

    status: printerLocationStatusEnum('status').notNull().default('disabled'),
    endpointUrl: text('endpoint_url').notNull(),
    tunnelId: text('tunnel_id').notNull(),
    driver: printerDriverEnum('driver').notNull().default('generic'),
    paperWidth: smallint('paper_width').notNull().default(80),
    codePage: printerCodePageEnum('code_page').notNull().default('big5'),
    defaultCopies: smallint('default_copies').notNull().default(1),
    cashDrawerEnabled: boolean('cash_drawer_enabled').notNull().default(false),

    tokenHash: text('token_hash').notNull(),
    pendingTokenHash: text('pending_token_hash'),
    rotationOverlapUntil: timestamp('rotation_overlap_until', { withTimezone: true }),
    pendingCommandType: text('pending_command_type'),
    pendingCommandPayload: jsonb('pending_command_payload'),
    tokenRotatedAt: timestamp('token_rotated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    bootstrapUsed: boolean('bootstrap_used').notNull().default(false),

    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    bridgeVersion: text('bridge_version'),
    printerStatus: printerStatusEnum('printer_status').notNull().default('unknown'),
    lastError: text('last_error'),
    lastPrinterModel: text('last_printer_model'),
    jobsServedTotal: integer('jobs_served_total').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    offlineIdx: index('location_printer_offline_idx')
      .on(t.lastSeenAt)
      .where(sql`${t.status} = 'enabled'`),
    statusIdx: index('location_printer_status_idx').on(t.status),
    staleAlertIdx: index('location_printer_stale_idx')
      .on(t.lastSeenAt)
      .where(sql`${t.status} = 'enabled'`),
  }),
);

export type LocationPrinterSettings = typeof locationPrinterSettings.$inferSelect;
export type NewLocationPrinterSettings = typeof locationPrinterSettings.$inferInsert;
export type PrinterDriver = (typeof printerDriverEnum.enumValues)[number];
export type PrinterCodePage = (typeof printerCodePageEnum.enumValues)[number];
export type PrinterStatus = (typeof printerStatusEnum.enumValues)[number];
export type PrinterLocationStatus = (typeof printerLocationStatusEnum.enumValues)[number];
```

Then add to `packages/database/src/schema/index.ts`:
```ts
export * from './location-printer-settings';
```

### 2.3 Acceptance

- [ ] `pnpm db:migrate` applies cleanly on dev, qa, staging, prod
- [ ] `drizzle migrate` down works (roll back)
- [ ] Type `LocationPrinterSettings` importable from `@macau-pos/database`
- [ ] `SELECT * FROM location_printer_settings` returns empty rowset on existing envs (no backfill required)

---

## 3. `@macau-pos/escpos-shared` package

### 3.1 package.json

```json
{
  "name": "@macau-pos/escpos-shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./drivers": { "import": "./dist/drivers/index.js", "types": "./dist/drivers/index.d.ts" },
    "./codepages": { "import": "./dist/codepages/index.js", "types": "./dist/codepages/index.d.ts" }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^1"
  }
}
```

### 3.2 Key types — `src/types.ts`

```ts
export type PrinterDriver = 'generic' | 'star' | 'epson' | 'custom';
export type PrinterCodePage = 'cp437' | 'gb18030' | 'big5' | 'shift_jis';
export type PaperWidth = 58 | 80;

export interface BuildOptions {
  driver: PrinterDriver;
  paperWidth: PaperWidth;
  codePage: PrinterCodePage;
  kickDrawer?: boolean;
}

export interface ReceiptInput {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  orderNumber: string;
  timestamp: Date;
  items: ReceiptItem[];
  subtotal: number;            // cents
  discountAmount?: number;     // cents
  taxAmount?: number;          // cents
  total: number;               // cents
  paymentMethod: string;       // label in cashier locale
  cashReceived?: number;       // cents
  change?: number;             // cents
  footer?: string;
  currency: string;            // "MOP", "HKD", etc.
  locale: 'tc' | 'sc' | 'en' | 'pt' | 'ja';
}

export interface ReceiptItem {
  name: string;                // already composed "Product · Variant"
  quantity: number;
  unitPrice: number;           // cents
  discount?: string;           // optional note line like "-10%" or "-MOP 5"
  lineTotal: number;           // cents
}

export interface TestPageInput {
  shopName: string;
  locationName: string;
  timestamp: Date;
  driver: PrinterDriver;
  paperWidth: PaperWidth;
  codePage: PrinterCodePage;
}
```

### 3.3 Driver interface — `src/drivers/types.ts`

```ts
import type { PaperWidth } from '../types';

export interface PrinterDriverDef {
  readonly name: string;

  // ESC @ (initialize)
  init(): Uint8Array;

  // ESC a <align>  (0=left, 1=center, 2=right)
  align(alignment: 'left' | 'center' | 'right'): Uint8Array;

  // ESC ! <bits>  (font/emphasis)
  emphasis(on: boolean): Uint8Array;
  doubleSize(on: boolean): Uint8Array;

  // Codepage select (ESC t <n>)
  selectCodePage(page: number): Uint8Array;

  // Feed n lines (ESC d n)
  feed(lines: number): Uint8Array;

  // Full cut / partial cut (GS V m)
  cut(mode: 'full' | 'partial'): Uint8Array;

  // Cash drawer kick (ESC p m t1 t2)
  kickDrawer(): Uint8Array;

  // Status query (GS r 1 or DLE EOT 4)
  queryStatus(): Uint8Array;

  // Parse status response byte(s) — returns paper-out / cover-open flags
  parseStatus(response: Uint8Array): PrinterStatusFlags;

  // Number of character columns at the given paper width
  columns(paperWidth: PaperWidth): number;
}

export interface PrinterStatusFlags {
  paperOut: boolean;
  coverOpen: boolean;
  error: boolean;
}
```

### 3.4 Driver implementations — `src/drivers/generic.ts` (signatures)

Each driver file exports one const implementing `PrinterDriverDef`.

```ts
// generic.ts — baseline ESC/POS (works on 95% of thermals)
export const genericDriver: PrinterDriverDef = {
  name: 'generic',
  init: () => new Uint8Array([0x1B, 0x40]),   // ESC @
  align: (a) => new Uint8Array([0x1B, 0x61, {left:0,center:1,right:2}[a]]),
  emphasis: (on) => new Uint8Array([0x1B, 0x45, on ? 1 : 0]),
  // ... full implementations written from ESC/POS spec
  columns: (w) => w === 58 ? 32 : 48,
};
```

Star and Epson drivers compose `genericDriver` for inherited methods + override: `cut` (Star partial-cut command differs), `kickDrawer` (different RJ11 pin mapping), `queryStatus` (Epson returns more granular bytes).

### 3.5 Receipt builder — `src/builder/build-receipt.ts`

```ts
export function buildReceipt(
  opts: BuildOptions,
  input: ReceiptInput,
): Uint8Array;
```

Implementation:
1. `init` — reset printer
2. `selectCodePage` — encode text correctly
3. Header — shop name centered, double-size; address/phone
4. Timestamp + order number
5. Items — two-column format with line-total right-aligned; optional discount line indented
6. Subtotal / discount / tax / total — right-aligned totals with column separator
7. Payment method + cash/change if cash
8. Locale-aware thank-you footer
9. Paper feed
10. If `kickDrawer` — drawer pulse
11. Cut (full or partial per driver)

Output: `Uint8Array` — single contiguous buffer, ready to write to USB or POST as base64.

### 3.6 Test-page builder — `src/builder/build-test-page.ts`

```ts
export function buildTestPage(input: TestPageInput): Uint8Array;
```

Content:
```
================================
     {shopName}
     {locationName}
================================
Driver:     {driver}
Paper:      {paperWidth}mm
Codepage:   {codePage}
Timestamp:  {timestamp}

CJK test:
  中文測試 (Traditional)
  中文测试 (Simplified)
  日本語テスト (Japanese)
  ÀÉÍÓÚ ñç (Portuguese)

If you can read this,
your printer is healthy.
================================
```

The CJK line renders correctly only if codepage matches printer firmware — that's the test.

### 3.7 Acceptance

- [ ] Unit tests for every driver method produce expected bytes (from ESC/POS spec)
- [ ] CJK codepage encoders handle edge characters (Big5 surrogate pairs, GB18030 4-byte characters)
- [ ] `buildReceipt({generic, 80, big5}, ...)` output matches golden fixture
- [ ] Byte-parity: `buildReceipt` output from browser (`happy-dom`) and Node is byte-identical for 10 fixture receipts

---

## 4. `@macau-pos/printer-bridge` package

### 4.1 package.json (REWRITES `packages/print-server/package.json`)

```json
{
  "name": "@macau-pos/printer-bridge",
  "version": "0.1.0",
  "description": "Cross-platform print-server daemon for Macau POS bridge devices",
  "type": "module",
  "bin": {
    "printer-bridge": "./dist/bin/printer-bridge.js"
  },
  "main": "./dist/daemon.js",
  "types": "./dist/daemon.d.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/bin/printer-bridge.js start",
    "test": "vitest run",
    "prepublishOnly": "pnpm build"
  },
  "files": [
    "dist/**",
    "install/**",
    "README.md"
  ],
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@macau-pos/escpos-shared": "workspace:*",
    "usb": "^2.14.0"
  },
  "optionalDependencies": {
  },
  "devDependencies": {
    "@types/node": "^22",
    "typescript": "^5",
    "vitest": "^1"
  }
}
```

Note: `usb` is a dependency (not optional) — install script installs libusb-1.0 system package before `npm install`.

### 4.2 CLI — `bin/printer-bridge.ts`

```ts
#!/usr/bin/env node
// CLI dispatcher

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case 'start':        await startDaemon(); break;
  case 'stop':         await stopDaemon(); break;
  case 'install':      await runInstall(args); break;  // --bootstrap <jwt> [--migrate]
  case 'uninstall':    await runUninstall(); break;
  case 'upgrade':      await runUpgrade(args); break;  // --auto | --force <ver>
  case 'status':       await printStatus(); break;
  case 'rotate-token': await rotateTokenLocal(); break;  // manual fallback
  default:             printUsage(); process.exit(1);
}
```

### 4.3 Daemon — `src/daemon.ts`

```ts
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { loadConfig } from './config';
import { detectBestAdapter } from './transport/detect';
import { makeBearerAuth } from './middleware/bearer-auth';
import { makeRateLimit } from './middleware/rate-limit';
import { makeIdempotency } from './middleware/idempotency';
import { logging } from './middleware/logging';
import { handlePrint } from './handlers/print';
import { handleTest } from './handlers/test';
import { handleHealth } from './handlers/health';
import { handleVersion } from './handlers/version';
import { startHeartbeat } from './heartbeat';
import { startUpdateCheck } from './update-check';

export interface BridgeContext {
  config: Config;
  configStore: ConfigStore;
  transport: TransportAdapter;
  writeLock: Semaphore;
  idempotency: IdempotencyCache;
  rateLimiter: RateLimiter;
  metrics: Metrics;
  startedAt: number;
  pendingAck?: string;
}

export async function startDaemon(): Promise<void> {
  const config = await loadConfig();
  const transport = await detectBestAdapter(config);
  const ctx: BridgeContext = {
    config,
    configStore: makeConfigStore(),
    transport,
    writeLock: new Semaphore(1),
    idempotency: new IdempotencyCache(5 * 60 * 1000),
    rateLimiter: new RateLimiter({ rps: 10, burst: 20 }),
    metrics: { jobsServedTotal: 0, startedAt: Date.now() },
    startedAt: Date.now(),
  };

  const server = createServer(async (req, res) => {
    try {
      logging.accessStart(req);
      // Route
      const url = new URL(req.url!, `http://${req.headers.host}`);
      if (req.method === 'GET' && url.pathname === '/version') return handleVersion(req, res, ctx);

      // Auth + rate-limit + idempotency apply to all other routes
      if (!(await makeBearerAuth(ctx)(req, res))) return;

      if (req.method === 'GET' && url.pathname === '/health') return handleHealth(req, res, ctx);
      if (req.method === 'POST' && url.pathname === '/print') {
        if (!makeRateLimit(ctx)(req, res)) return;
        return handlePrint(req, res, ctx);
      }
      if (req.method === 'POST' && url.pathname === '/test') return handleTest(req, res, ctx);

      res.writeHead(404).end();
    } catch (err) {
      logging.error('unhandled error', err);
      res.writeHead(500).end();
    } finally {
      logging.accessEnd(req, res);
    }
  });

  server.listen(config.listenPort, '127.0.0.1', () => {
    logging.info(`printer-bridge listening on 127.0.0.1:${config.listenPort}`);
  });

  startHeartbeat(ctx);
  startUpdateCheck(ctx);

  setupGracefulShutdown(ctx, server);
}
```

### 4.4 Config — `src/config.ts`

Config file location per platform:
| Platform | Path |
|---|---|
| Linux / OpenWRT | `/etc/printer-bridge/config.json` |
| macOS | `/Library/Application Support/printer-bridge/config.json` |
| Windows | `%PROGRAMDATA%\printer-bridge\config.json` |

Schema (JSON):
```json
{
  "version": "0.1.0",
  "locationId": "uuid",
  "tenantSlug": "countingstars",
  "endpointUrl": "https://print-countingstars.hkretailai.com/print",
  "heartbeatUrl": "https://admin.hkretailai.com/api/printers/heartbeat",
  "token": "base64url-encoded-32-bytes",
  "listenPort": 3901,
  "transport": "auto",              // auto | linux-lp | node-usb | cups
  "cupsPrinterName": null,          // only used if transport=cups
  "logLevel": "info",
  "sentryDsn": "https://..."
}
```

Atomic write (crash-safe):
```ts
export async function writeConfigAtomic(next: Config): Promise<void> {
  const tmp = configPath + '.tmp';
  const bak = configPath + '.bak';
  await fs.writeFile(tmp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  try { await fs.rename(configPath, bak); } catch {}
  await fs.rename(tmp, configPath);
}
```

### 4.5 Bootstrap — `src/bootstrap.ts`

Called by `printer-bridge install --bootstrap <jwt>`.

```ts
export async function bootstrapFromJwt(
  jwt: string,
  adminBaseUrl: string = 'https://admin.hkretailai.com',
  opts?: { migrate?: boolean },
): Promise<void> {
  const res = await fetch(`${adminBaseUrl}/api/printers/bootstrap`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ migrate: opts?.migrate ?? false }),
  });
  if (!res.ok) throw new Error(`bootstrap failed: ${res.status}`);
  const body = await res.json();

  // body: { tunnelId, tunnelCredentials, bearerToken, endpointUrl, heartbeatUrl, locationId, tenantSlug, version }
  const config: Config = {
    version: PACKAGE_VERSION,
    locationId: body.locationId,
    tenantSlug: body.tenantSlug,
    endpointUrl: body.endpointUrl,
    heartbeatUrl: body.heartbeatUrl,
    token: body.bearerToken,
    listenPort: 3901,
    transport: 'auto',
    cupsPrinterName: null,
    logLevel: 'info',
    sentryDsn: process.env.SENTRY_DSN ?? null,
  };
  await writeConfigAtomic(config);

  // Write cloudflared credentials
  const cfCredPath = platformCfCredsPath();
  await fs.writeFile(cfCredPath, Buffer.from(body.tunnelCredentials, 'base64'), { mode: 0o600 });

  // Write cloudflared ingress config
  await writeCloudflaredConfig(body.tunnelId, { localPort: 3901 });
}
```

### 4.6 Handlers — `src/handlers/print.ts` (signature)

```ts
import type { BridgeContext } from '../daemon';

export async function handlePrint(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: BridgeContext,
): Promise<void>;
```

Full pseudocode already in `PLANNING §8.2` — blueprint cross-reference.

### 4.7 Middleware signatures

```ts
// bearer-auth.ts
export function makeBearerAuth(ctx: BridgeContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean>;
  // returns true if authed; otherwise writes 401 + returns false
}

// rate-limit.ts (token-bucket, 10 rps, burst 20)
export function makeRateLimit(ctx: BridgeContext) {
  return (req: IncomingMessage, res: ServerResponse): boolean;
  // returns true if within budget; otherwise writes 429 + returns false
}

// idempotency.ts (5-min LRU by Idempotency-Key header)
export function makeIdempotency(ctx: BridgeContext) {
  return {
    check(req: IncomingMessage): { hit: true; body: unknown; status: number } | { hit: false };
    record(key: string, status: number, body: unknown): void;
  };
}
```

### 4.8 Transport adapters

**`linux-lp.ts`** (Linux + OpenWRT):

```ts
export class LinuxLpAdapter implements TransportAdapter {
  readonly name = 'linux-lp' as const;
  private devicePath: string | null = null;

  async init() {
    this.devicePath = await this.findLpDevice();  // scans /dev/usb/lp*
  }

  async write(bytes: Buffer, opts: { timeoutMs: number }) {
    if (!this.devicePath) this.devicePath = await this.findLpDevice();
    if (!this.devicePath) throw new PrinterOfflineError('no /dev/usb/lp*');
    const fd = await fs.open(this.devicePath, 'w');
    try {
      await Promise.race([
        fd.write(bytes, 0, bytes.length),
        sleep(opts.timeoutMs).then(() => { throw new PrinterTimeoutError(); }),
      ]);
    } finally {
      await fd.close();
    }
  }

  async probe(): Promise<PrinterProbeResult> {
    const p = await this.findLpDevice();
    if (!p) return { up: false, lastError: 'no lp device' };
    // Optional: post-write ioctl LPGETSTATUS if available
    return { up: true, model: p };
  }

  private async findLpDevice(): Promise<string | null> {
    for (let i = 0; i < 4; i++) {
      const p = `/dev/usb/lp${i}`;
      try { await fs.access(p, fs.constants.W_OK); return p; } catch {}
    }
    return null;
  }
}
```

**`node-usb.ts`** (macOS + Windows primary):

Uses `usb` package. On init, finds printer-class USB device (class 7), claims interface, sets endpoints. `write` pipes bytes to OUT endpoint. `probe` sends `GS r 1` status query and reads the response byte. Handles C4 (out-of-paper detection via status byte bit 2).

**`cups.ts`** (fallback):

Spawns `lp -d <printerName> -o raw` with bytes on stdin. Shell-out only. `probe` runs `lpstat -p <name>` and parses output.

**`detect.ts`**:

```ts
export async function detectBestAdapter(config: Config): Promise<TransportAdapter> {
  if (config.transport === 'linux-lp') return new LinuxLpAdapter();
  if (config.transport === 'node-usb') return new NodeUsbAdapter();
  if (config.transport === 'cups') return new CupsAdapter(config.cupsPrinterName!);

  // Auto
  if (process.platform === 'linux') {
    const lp = new LinuxLpAdapter();
    await lp.init();
    if (lp.devicePath) return lp;
  }
  try {
    const usbA = new NodeUsbAdapter();
    await usbA.init();
    return usbA;
  } catch (e) {
    logging.warn('node-usb unavailable, falling back to CUPS', e);
  }
  return new CupsAdapter('Xprinter');  // sensible default name
}
```

### 4.9 Commands — `src/commands/apply.ts`

```ts
export interface HeartbeatCommand {
  id: string;
  type: 'rotate_token' | 'force_update' | 'reload_config';
  payload: Record<string, unknown>;
}

export async function applyCommands(
  ctx: BridgeContext,
  commands: HeartbeatCommand[],
): Promise<string | undefined>;   // returns id of last applied, or undefined
```

`rotate-token.ts`, `force-update.ts`, `reload-config.ts` — each exports a single `apply(ctx, cmd)` function. Failure logs + re-throws — don't ACK, server re-sends next heartbeat.

### 4.10 Self-update — `src/self-update.ts`

Full pseudocode in `PLANNING §8.7`. Key public signature:

```ts
export async function performUpdate(
  ctx: BridgeContext,
  targetVersion: string,
): Promise<{ ok: true; newVersion: string } | { ok: false; reason: string; rolledBackTo?: string }>;
```

### 4.11 Acceptance for `@macau-pos/printer-bridge`

- [ ] Daemon starts cleanly on macOS, Raspberry Pi OS (Linux)
- [ ] `curl localhost:3901/version` returns string
- [ ] Bad bearer token → 401 within 1ms (HMAC verify)
- [ ] 11 requests in 1s → last 1 gets 429
- [ ] Idempotent replay of same `Idempotency-Key` returns cached response
- [ ] USB write to N160II produces test receipt
- [ ] CUPS fallback works when macOS Gatekeeper blocks libusb
- [ ] Config rotation via heartbeat command, ACKed in next heartbeat
- [ ] `printer-bridge uninstall` removes daemon + config + tunnel config + service unit

---

## 5. Admin app changes

### 5.1 Server actions — `apps/admin/src/lib/printer-actions.ts`

All actions marked `"use server"`, filter by `tenantId` from session.

```ts
// Schemas
const PrinterConfigPatchSchema = z.object({
  driver: z.enum(['generic', 'star', 'epson', 'custom']).optional(),
  paperWidth: z.union([z.literal(58), z.literal(80)]).optional(),
  codePage: z.enum(['cp437', 'gb18030', 'big5', 'shift_jis']).optional(),
  defaultCopies: z.number().int().min(1).max(10).optional(),
  cashDrawerEnabled: z.boolean().optional(),
});

// B1
export async function getLocationPrinterSettings(
  locationId: string,
): Promise<LocationPrinterSettings | null>;

// B2
export async function updateLocationPrinterSettings(
  locationId: string,
  patch: z.infer<typeof PrinterConfigPatchSchema>,
): Promise<{ ok: true } | { ok: false; error: string }>;

// B3
export async function rotateLocationPrinterToken(
  locationId: string,
): Promise<
  | { ok: true; rawToken: string; rotatedAt: Date; overlapUntil: Date; bridgeWillUpdateWithin: number }
  | { ok: false; error: 'not_found' | 'command_pending' | 'unauthorized' }
>;

// B4 — the big one (M3 fix)
export async function provisionLocationPrinter(
  locationId: string,
  shopSlug: string,          // validated against tenant/location slug rules
): Promise<
  | { ok: true; endpointUrl: string; tunnelId: string; bootstrapToken: string }
  | { ok: false; error: 'already_provisioned' | 'cf_api_error' | 'unauthorized' }
>;

// B5
export async function testLocationPrinter(
  locationId: string,
): Promise<
  | { ok: true; receiptPrinted: true; durationMs: number }
  | { ok: false; error: string; message: string }
>;

// B6
export async function getLocationPrinterStatus(
  locationId: string,
): Promise<{
  row: LocationPrinterSettings;
  health: { ok: true; data: HealthResponse } | { ok: false; error: string };
}>;

// B7
export async function setLocationPrinterStatus(
  locationId: string,
  nextStatus: 'enabled' | 'disabled' | 'maintenance',
  opts?: { destroyTunnelOnDisable?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }>;

// B8 — W5 fix
export async function migrateLocationPrinterBridge(
  locationId: string,
): Promise<
  | { ok: true; bootstrapToken: string; instructions: string }
  | { ok: false; error: string }
>;

// B9 — M5 fix
export async function getFleetPrinterStatus(
  tenantId: string,
): Promise<Array<{
  locationId: string;
  locationName: string;
  status: PrinterLocationStatus;
  printerStatus: PrinterStatus;
  lastSeenAt: Date | null;
  alertLevel: 'ok' | 'warning' | 'error';
}>>;
```

### 5.2 Hash helpers — `apps/admin/src/lib/printer-hash.ts`

```ts
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const PEPPER = () => {
  const p = process.env.APP_PEPPER;
  if (!p) throw new Error('APP_PEPPER env missing');
  return p;
};

export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return createHmac('sha256', PEPPER()).update(raw).digest('hex');
}

export function verifyToken(raw: string, storedHash: string): boolean {
  const candidate = hashToken(raw);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

### 5.3 CF API wrapper — `apps/admin/src/lib/printer-cf.ts`

```ts
export async function createTunnel(name: string): Promise<{ tunnelId: string; credentials: string }>;
export async function deleteTunnel(tunnelId: string): Promise<void>;
export async function upsertDnsRecord(
  zoneId: string,
  hostname: string,
  tunnelId: string,
): Promise<void>;
export async function deleteDnsRecord(zoneId: string, hostname: string): Promise<void>;
```

All functions use `CF_API_TOKEN` env; `CF_ACCOUNT_ID` and `CF_ZONE_ID` from env too.

### 5.4 Bootstrap JWT — `apps/admin/src/lib/printer-jwt.ts`

```ts
interface BootstrapClaims {
  sub: 'bootstrap';
  iss: 'admin.hkretailai.com';
  aud: 'printer-bridge';
  locationId: string;
  tenantId: string;
  migrate?: boolean;
  jti: string;
  exp: number;
  iat: number;
}

export function signBootstrap(
  payload: Omit<BootstrapClaims, 'sub' | 'iss' | 'aud' | 'jti' | 'exp' | 'iat'>,
  ttlSec = 3600,
): string;

export function verifyBootstrap(jwt: string): BootstrapClaims;  // throws on invalid
```

Uses existing `jose` library (same as session JWTs in the app).

### 5.5 API route — `apps/admin/src/app/api/printers/heartbeat/route.ts`

Full implementation already shown in `PLANNING §8.5`.

### 5.6 API route — `apps/admin/src/app/api/printers/bootstrap/route.ts`

Full implementation already shown in `PLANNING §9.1`.

### 5.7 Fleet alert job — `apps/admin/src/lib/fleet-alert-job.ts`

Runs via a Vercel Cron or equivalent every 15 min:

```ts
export async function runFleetAlertCheck(): Promise<void> {
  const stale = await db.select().from(locationPrinterSettings)
    .where(
      and(
        eq(locationPrinterSettings.status, 'enabled'),
        or(
          isNull(locationPrinterSettings.lastSeenAt),
          lt(locationPrinterSettings.lastSeenAt, new Date(Date.now() - 4 * 60 * 60 * 1000)),
        ),
      ),
    );

  for (const row of stale) {
    const gapHours = row.lastSeenAt
      ? (Date.now() - row.lastSeenAt.getTime()) / 3_600_000
      : null;
    const severity = (gapHours ?? Infinity) >= 24 ? 'error' : 'warning';

    Sentry.captureMessage(
      `Printer offline: location=${row.locationId} gap=${gapHours?.toFixed(1)}h`,
      { level: severity, tags: { component: 'printer-fleet-alert' } },
    );
    // optionally: enqueue email to tenant admin
  }
}
```

### 5.8 UI pages

**`apps/admin/src/app/(dashboard)/locations/[id]/printer/page.tsx`** — Server Component, renders:
- `<PrinterProvisionPanel>` if no row exists for this location
- `<PrinterForm>` + `<StatusCard>` + `<TestPrintButton>` + `<TokenRotateDialog>` + `<MigrateBridgeDialog>` if row exists

**`apps/admin/src/app/(dashboard)/printers/page.tsx`** — Server Component, renders fleet table from `getFleetPrinterStatus`.

### 5.9 Acceptance

- [ ] `pnpm --filter admin build` passes
- [ ] Provisioning a fresh location creates CF tunnel + DNS + DB row
- [ ] Test print button returns success within 5s when bridge is healthy
- [ ] Rotate token: new token shown once; after ≤60s, bridge operates with new; old still works during 10-min overlap
- [ ] Migrating bridge: `bootstrapToken` returned; installer command documented; tunnel_id + endpoint_url unchanged
- [ ] Fleet dashboard lists all locations with latest status + alert badge

---

## 6. Cashier app changes

### 6.1 Printer context — `apps/cashier/src/contexts/printer-context.tsx`

```tsx
interface PrinterConfig {
  enabled: boolean;
  endpointUrl: string;
  token: string;               // server-fetched each session
  driver: PrinterDriver;
  paperWidth: 58 | 80;
  codePage: PrinterCodePage;
  defaultCopies: number;
  cashDrawerEnabled: boolean;
}

export const PrinterContext = createContext<PrinterConfig | null>(null);

export function PrinterContextProvider({ children }: PropsWithChildren) {
  // Fetch on mount, cache in react-query (stale 5 min)
  // If 404 or status !== 'enabled', provide null
  ...
}

export function usePrinter(): PrinterConfig | null {
  return useContext(PrinterContext);
}
```

### 6.2 Print helper — `apps/cashier/src/lib/printer.ts`

```ts
import { buildReceipt } from './escpos/build-receipt';

export type PrinterErrorCode =
  | 'printer_offline' | 'printer_timeout' | 'no_paper' | 'invalid_payload'
  | 'unauthorized' | 'rate_limited' | 'bridge_internal' | 'network_unreachable';

export type PrintResult =
  | { ok: true; durationMs: number; method: 'network' }
  | { ok: true; method: 'iframe' }
  | { ok: false; error: PrinterErrorCode; retryable: boolean };

export async function sendPrintJob(params: {
  config: PrinterConfig | null;
  receipt: ReceiptInput;
  copies?: number;
}): Promise<PrintResult>;
```

### 6.3 Edited: `apps/cashier/src/components/receipt/print-receipt.tsx`

Adds branch:
```tsx
const config = usePrinter();

async function handlePrint() {
  const data = await getReceiptData(orderNumber);
  const result = await sendPrintJob({ config, receipt: data });
  if (!result.ok) {
    showPrinterErrorToast(result.error);
    return;
  }
  if (result.method === 'network') showSuccessToast();
  // iframe path shows nothing (existing behavior)
}
```

Keeps the existing iframe fallback for when `config` is null or disabled.

### 6.4 i18n — `apps/cashier/src/i18n/locales.ts` additions

```ts
// Add to each locale block (tc, sc, en, pt, ja):
printerSending: { tc: "發送中...", sc: "发送中...", en: "Sending...", pt: "Enviando...", ja: "送信中..." },
printerSuccess: { tc: "已打印收據", sc: "已打印收据", en: "Receipt printed", pt: "Recibo impresso", ja: "レシート印刷完了" },
printerErrorOffline: { ... },
printerErrorNetwork: { ... },
printerErrorNoPaper: { ... },
printerErrorTimeout: { ... },
printerErrorRateLimit: { ... },
printerNotConfigured: { ... },
printerTestButton: { ... },
printerReprintFromHistory: { ... },
printerConfirmReprint: { ... },
```

### 6.5 Acceptance

- [ ] Cashier with `status='enabled'` location prints via network path
- [ ] Cashier with no printer config falls back to iframe (no regression)
- [ ] All 5 locales render correctly for all 11 new keys
- [ ] Toast on failure doesn't block navigation
- [ ] Reprint from history works identically to first print

---

## 7. Install scripts

### 7.1 `install/install.sh` (universal entry)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Detect OS, download platform script, run it
PLATFORM=$(uname -s)
case "$PLATFORM" in
  Darwin)  URL="https://install.hkretailai.com/printer-bridge-macos.sh" ;;
  Linux)
    if grep -q "^NAME=\"OpenWrt\"" /etc/os-release 2>/dev/null; then
      URL="https://install.hkretailai.com/printer-bridge-openwrt.sh"
    else
      URL="https://install.hkretailai.com/printer-bridge-linux.sh"
    fi
    ;;
  *)       echo "Unsupported platform: $PLATFORM"; exit 1 ;;
esac

curl -fsSL "$URL" | bash -s -- "$@"
```

Users run: `curl -fsSL https://install.hkretailai.com/printer-bridge.sh | bash -s -- --bootstrap <jwt>`

### 7.2 `install/linux-systemd.sh`

Steps:
1. Verify Node 20+ installed (install via NodeSource if not)
2. Verify libusb-1.0 installed (`apt install libusb-1.0-0` on Debian)
3. `npm install -g @macau-pos/printer-bridge`
4. Create `printer-bridge` user
5. Write systemd unit `/etc/systemd/system/printer-bridge.service`
6. Write systemd timer `/etc/systemd/system/printer-bridge-update.timer`
7. Download cloudflared binary for arch
8. Write cloudflared service `/etc/systemd/system/cloudflared.service`
9. Run `printer-bridge install --bootstrap <jwt>` to fetch tunnel creds + token
10. Enable + start services
11. Wait for first heartbeat success
12. Print success message

### 7.3 Similar scripts per platform

Details in each file following the same shape. Exact paths + service manager commands differ.

### 7.4 Acceptance

- [ ] `install.sh` on Raspberry Pi OS produces working bridge in ≤ 10 min
- [ ] Same on macOS Sonoma
- [ ] `uninstall.sh` removes everything cleanly (services, binaries, config, user account)
- [ ] All scripts are idempotent (re-running doesn't break)

---

## 8. Environment variables reference

### 8.1 Admin (ECS / Vercel)

| Var | Purpose | Where | Rotation |
|---|---|---|---|
| `APP_PEPPER` | HMAC-SHA256 pepper for `token_hash` | all envs | Only by runbook — requires re-hashing all tokens |
| `CF_API_TOKEN` | Cloudflare API key (scoped) | all envs | 90 days |
| `CF_ACCOUNT_ID` | CF account UUID | all envs | Rarely |
| `CF_ZONE_ID` | `hkretailai.com` zone ID | all envs | Never |
| `BOOTSTRAP_JWT_SECRET` | Sign/verify bootstrap JWTs | all envs | On-demand |
| `BOOTSTRAP_TOKEN_CACHE_TTL_SEC` | Default 3600 | optional | — |

### 8.2 Bridge daemon (on shop devices)

Stored in `config.json`, not env:
- `SENTRY_DSN` — optional, for error reporting
- No CF or admin secrets ever on bridge

### 8.3 Cashier + admin client

No env vars for this module; all config comes from server-rendered session.

---

## 9. Coding conventions (this module)

1. **File naming:** kebab-case (`printer-actions.ts`) matching existing repo convention.
2. **Error surface:** typed `PrinterErrorCode` union; never `throw new Error(stringish)` from server actions — return discriminated unions.
3. **Zod at boundaries:** every JSON body parsed through a Zod schema exported from a shared `schemas.ts`. Infer types from schema with `z.infer`.
4. **No `any`:** strictly typed. Use `unknown` + narrowing.
5. **Server actions:** `"use server"` at top; filter by `tenantId` from session first line.
6. **Public action return shape:** `{ ok: true; ...data } | { ok: false; error: SpecificCode; message?: string }`.
7. **Logging:** `logging.info/warn/error` — structured JSON on bridge; Sentry breadcrumbs on admin + cashier.
8. **No console.log** except in install scripts.
9. **Byte-array everywhere for ESC/POS:** `Uint8Array`, never `string` (UTF-8 assumptions silently break CJK).
10. **Migration numbering:** `0006_*` — sequential, never edit applied migrations.
11. **Timezone:** always `TIMESTAMPTZ` in SQL, `Date` in TS, never string.
12. **Currency:** integer cents; no floating point.
13. **i18n:** every user-facing string is an i18n key in all supported locales.

---

## 10. Sub-phase A→P acceptance matrix

Mapping from Planning §15 build order to this blueprint:

| Sub-phase | Planning §15 task | Blueprint section | Output artifact | Acceptance test |
|---|---|---|---|---|
| A | escpos-shared | §3 | `packages/escpos-shared/**` | §3.7 tests pass |
| B | Migration 0006 | §2 | Migration file + schema | §2.3 acceptance |
| C | Bridge daemon skeleton | §4.1–4.3 | Daemon HTTP server | §4.11 subset |
| D | Transport adapters | §4.8 | 3 adapter classes | USB writes a byte |
| E | /print + /test handlers | §4.6 + §4.9 | End-to-end print | §4.11 subset |
| F | Heartbeat + endpoint | §4.2 + §5.5 | `last_seen_at` updates | Manual 60s test |
| G | Command channel | §4.9 + §8.5 | Rotate + force-update work | §5.9 subset |
| H | Admin UI + actions | §5.1 + §5.8 | Admin pages live | §5.9 full |
| I | Server-side CF provisioning | §5.3 + §5.4 + §5.6 | `provisionLocationPrinter` works | Provisions a tenant end-to-end |
| J | Install scripts | §7 | Running scripts for macOS + Linux | §7.4 |
| K | Bridge migration flow | §5.1 (B8) + bootstrap migrate flag | `--migrate` works | I4 scenario |
| L | Self-update + rollback | §4.10 + update-check | Break a version, rollback works | AT-22 |
| M | Cashier integration | §6 | Network print from iPad | §6.5 |
| N | Sentry alerts + fleet dashboard | §5.7 + §5.8 | Alerts fire | S3 scenario |
| O | End-to-end QA on CountingStars | — | QA-001 to QA-008 green | Full QA pass |
| P | Documentation | — | SOP + runbook + migration playbook | Operator can follow cold |

---

## 11. Phase B Sign-off

**Deliverables:**
- File-level impact map (§1)
- Database migration + Drizzle schema (§2)
- `@macau-pos/escpos-shared` blueprint (§3)
- `@macau-pos/printer-bridge` blueprint (§4)
- Admin app changes (§5)
- Cashier app changes (§6)
- Install scripts (§7)
- Env var reference (§8)
- Coding conventions (§9)
- Sub-phase A→P acceptance matrix (§10)

**Decision required:** Is this blueprint detailed enough for a developer to code from?

- [ ] Approved — proceed to Phase C (Test Plan)
- [ ] Revisions needed — _specify below_

**User notes:**
_(to be filled)_
