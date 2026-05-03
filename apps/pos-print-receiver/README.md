# POS Print Receiver

Tiny iOS app that receives ESC/POS bytes via custom URL scheme and forwards them to a LAN thermal printer over plain TCP.

**Companion to:** the web cashier (`pos.hkretailai.com`) running in iPad Safari. Fires `pos-print://send?...` when a sale completes; iOS launches us, we send bytes, return to Safari.

**Bundle ID:** `com.hkretailai.posprint`
**iPad only.** Built for the dock-mounted POS terminal.

## URL contract

```
pos-print://send?host=192.168.123.100&port=9100&bytes=<urlencoded-base64>
```

| Param | Type | Notes |
|---|---|---|
| `host` | string | Printer's LAN IP. Required. |
| `port` | uint16 | Printer's TCP port (typically `9100`). Required. |
| `bytes` | base64 | URL-encoded base64 of the ESC/POS byte stream. Required. ≤64KB after decode. |

## Project structure

```
apps/pos-print-receiver/
├── project.yml              ← xcodegen spec (regenerate the .xcodeproj from here)
├── Sources/
│   ├── PosPrintReceiverApp.swift   (App entry + .onOpenURL)
│   ├── PrintService.swift          (URL parsing + Network.framework TCP)
│   └── ContentView.swift           (Minimal status UI)
├── Resources/
│   └── Info.plist                  (URL scheme + NSLocalNetworkUsageDescription)
└── README.md
```

## Build (xcodegen path)

```bash
brew install xcodegen          # one-time
cd apps/pos-print-receiver
xcodegen                       # generates PosPrintReceiver.xcodeproj
open PosPrintReceiver.xcodeproj
```

In Xcode:
1. Select the `PosPrintReceiver` target → Signing & Capabilities → set your Apple Developer team
2. (Optional) Adjust Display Name, Version
3. Connect iPad via cable, select it as run target, Cmd+R

## Build (manual Xcode path, no xcodegen)

If you don't want to install xcodegen:

1. Xcode → File → New → Project → iOS → App
2. Product Name: `POS Print Receiver`, Interface: SwiftUI, Language: Swift, Bundle ID: `com.hkretailai.posprint`, Storage: None, Tests: off
3. Save anywhere; you'll throw the auto-generated `ContentView.swift` and `…App.swift` away
4. Delete the auto-generated `ContentView.swift`, the auto-generated `…App.swift`, and the auto-generated `Info.plist` (the latter only if Xcode created a standalone one — Xcode 13+ usually doesn't)
5. Drag in this directory's `Sources/*.swift` (Add to target ✅)
6. Replace the project's `Info.plist` with this directory's `Resources/Info.plist`, OR add the keys (`CFBundleURLTypes`, `NSLocalNetworkUsageDescription`) to your project's auto-generated info config
7. Build & run

## First-run on iPad

1. Trust the developer cert: Settings → General → VPN & Device Management → Trust
2. Open the app once — it shows "Ready"
3. The first time the web cashier fires `pos-print://`, iOS prompts for Local Network access — Allow
4. Subsequent prints work silently (Safari → app → Safari, ~200–400ms flicker)

## How the cashier finds this app

The web cashier reads `terminals.device_info.printer.method` from the DB. To enable URL-scheme dispatch on a terminal, run:

```sql
UPDATE terminals
SET device_info = jsonb_set(
  COALESCE(device_info, '{}'::jsonb),
  '{printer}',
  '{"method":"url-scheme","host":"192.168.123.100","port":9100}'::jsonb
)
WHERE id = '<terminal-uuid>';
```

When the cashier next attempts to print, it will hit `getReceiptBytesForUrlScheme(orderNumber, terminalId, locale)` (in `apps/cashier/src/lib/network-printer.ts`), receive base64 bytes + host + port, and fire the URL.

If `method` is not `url-scheme` or unset, the cashier falls back to the Module 12 bridge daemon path (existing behavior).

## What this app deliberately does NOT do

- No background processing (URL-scheme handler runs only when invoked)
- No HTTP server, no Bonjour, no peer-to-peer — just a one-way TCP write per URL
- No data persistence beyond the in-memory "last print at" status shown on screen
- No authentication — anyone on the iPad with the URL scheme can fire it. The threat model is: same iPad, same physical user, same shop. If a hostile app on the iPad fires arbitrary `pos-print://` URLs, they'd just print junk receipts.

## Limits

- **Receipt size:** ~16 KB after URL-encode + base64. Real receipts are 1–2 KB so this is fine. If a receipt grows beyond ~12 KB, consider hand-off via shared pasteboard or a localhost HTTP server (more complex).
- **Fire-and-forget:** the web cashier cannot synchronously confirm print success. Cashier sees the receipt physically — if it didn't print, they press reprint.
- **Concurrent prints:** two URL-scheme fires in rapid succession will queue at the iOS app level. The second one waits until the first TCP write finishes (~150ms). Acceptable for human-pace sales.

## SourceKit diagnostics in this repo

Until you run `xcodegen` (or manually create an Xcode project), SourceKit will report `Cannot find 'X' in scope` errors for cross-file references between the `Sources/*.swift` files. These are **expected** — without a target there's no module context. They clear once the project is generated and the files are added to the target.
