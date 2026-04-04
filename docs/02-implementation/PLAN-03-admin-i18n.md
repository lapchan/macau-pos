# Plan: Admin Dashboard i18n — Complete Internationalization

## Context
The admin dashboard has **345 hardcoded English strings across 32 files** with zero i18n infrastructure. The cashier app already has a working custom TypeScript i18n system with 117 keys and 5 languages. This plan adds full i18n to the admin dashboard, reusing the same pattern for consistency.

**Goal:** Every visible label, button, heading, placeholder, error message, status badge, and aria-label in the admin app must be translatable across 5 languages: English, Traditional Chinese, Simplified Chinese, Portuguese, and Japanese.

---

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Shared vs per-app | **Shared types** (`packages/i18n`) + **per-app keys** | Different vocabularies per app; shared `Locale` type |
| Key structure | **Flat with dot naming** (`sidebar.home`, `items.addItem`) | Matches cashier pattern, simpler TypeScript types |
| State management | **React Context** (`useLocale()` hook) | 32+ files need locale, prop-drilling impractical |
| Server components | **Cookie-based** locale reading | Cashier uses this pattern; works with SSR metadata |
| Interpolation | **`{key}` template replacement** | Simple, no library, handles all admin use cases |
| Persistence | **localStorage + cookie** (`admin-locale`) | Cookie for SSR, localStorage for fast client reads |

---

## New Files (4)

### 1. `packages/i18n/` — Shared i18n package
```
packages/i18n/
  package.json           # @macau-pos/i18n
  src/
    index.ts             # barrel export
    types.ts             # Locale type, localeNames, localeFlags
    utils.ts             # interpolate() helper
```
Extract `Locale`, `localeNames`, `localeFlags` from cashier. Both apps import from `@macau-pos/i18n`.

### 2. `apps/admin/src/i18n/locales.ts` — Translation dictionary (~260 keys × 5 languages)

Key namespaces:
| Namespace | ~Keys | Covers |
|-----------|-------|--------|
| `common` | 30 | Cancel, Delete, Save, Edit, Search, Export, Import, Close, MOP, status labels, pagination |
| `sidebar` | 15 | All nav items, Take payment, Sign out, Notifications, Inbox, Help |
| `login` | 11 | Sign in, Email/Phone, Password, demo hint |
| `home` | 6 | Welcome back, date format |
| `setup` | 12 | Setup steps, progress, labels |
| `quickActions` | 6 | Action labels |
| `performance` | 12 | Chart labels, metrics |
| `insights` | 10 | AI card titles, descriptions |
| `terminalStatus` | 15 | Dashboard terminal card |
| `items` | 45 | Table, slide-over form, delete dialog, bulk bar |
| `orders` | 25 | Table, metrics, payment methods, statuses |
| `customers` | 25 | Table, tiers, stats |
| `terminals` | 40 | Full page, grid/list, statuses, actions |
| `comingSoon` | 3 | Placeholder pages |

### 3. `apps/admin/src/i18n/context.tsx` — LocaleProvider + useLocale() hook
- React Context with `locale` + `setLocale`
- Persists to `localStorage("admin-locale")` + cookie
- Default: `"tc"` (Traditional Chinese — Macau primary)

### 4. `apps/admin/src/components/sidebar/language-switcher.tsx` — Language picker
- Shows current flag + locale name (expanded) or flag only (collapsed)
- Dropdown with 5 languages
- Uses `useLocale()` hook

---

## Modified Files (32)

Every file with hardcoded strings gets updated to use `t(locale, "key")`:

| File | Strings | Priority |
|------|---------|----------|
| `app/(dashboard)/dashboard-shell.tsx` | 2 | Wrap with `<LocaleProvider>` |
| `app/layout.tsx` | 1 | Dynamic `html lang` from cookie |
| `components/sidebar/app-sidebar.tsx` | 19 | Nav labels + language switcher |
| `app/(dashboard)/items/items-client.tsx` | 41 | Table, search, status badges |
| `components/items/product-slide-over.tsx` | 31 | Form labels, buttons |
| `app/(dashboard)/terminals/page.tsx` | 44 | Terminal statuses, metrics |
| `app/(dashboard)/orders/orders-client.tsx` | 31 | Metrics, payment methods |
| `app/(dashboard)/customers/page.tsx` | 28 | Stats, tiers, table |
| `components/dashboard/*.tsx` (5 cards) | 46 | Dashboard cards |
| `components/shared/*.tsx` | 12 | Coming soon, date range, metric card |
| `components/items/delete-confirm-dialog.tsx` | 7 | With interpolation |
| `components/items/bulk-actions-bar.tsx` | 8 | Status options, buttons |
| `app/(auth)/login/page.tsx` | 11 | Login form |
| `app/(dashboard)/page.tsx` | 2 | Home title |
| 6× coming soon pages | 6 | Page titles |

---

## Build Order (8 phases, 20 steps)

### Phase 1: Foundation
| Step | Task |
|------|------|
| 1 | Create `packages/i18n/` shared package (Locale type, interpolate) |
| 2 | Create `apps/admin/src/i18n/locales.ts` (260 keys, EN first, stub other 4) |
| 3 | Create `apps/admin/src/i18n/context.tsx` (LocaleProvider, useLocale) |
| 4 | Wire LocaleProvider into `dashboard-shell.tsx` |
| 5 | Update `app/layout.tsx` for dynamic `html lang` |

### Phase 2: Sidebar + Shared
| Step | Task |
|------|------|
| 6 | Translate `app-sidebar.tsx` + add language switcher |
| 7 | Translate shared components (coming-soon, page-header, date-range-selector, metric-card) |

### Phase 3: Dashboard Home
| Step | Task |
|------|------|
| 8 | Translate home page + 5 dashboard cards |
| 9 | i18n-ify mock data (setup steps, quick actions, insights) |

### Phase 4: Items Pages
| Step | Task |
|------|------|
| 10 | Translate `items-client.tsx` (41 strings) |
| 11 | Translate `product-slide-over.tsx` (31 strings) |
| 12 | Translate `delete-confirm-dialog.tsx` + `bulk-actions-bar.tsx` |

### Phase 5: Orders & Customers
| Step | Task |
|------|------|
| 13 | Translate `orders-client.tsx` (31 strings) |
| 14 | Translate `customers/page.tsx` (28 strings) |

### Phase 6: Terminals
| Step | Task |
|------|------|
| 15 | Translate `terminals/page.tsx` (44 strings) |

### Phase 7: Login + Remaining
| Step | Task |
|------|------|
| 16 | Translate `login/page.tsx` (11 strings) |
| 17 | Translate remaining small components |

### Phase 8: Complete All Translations
| Step | Task |
|------|------|
| 18 | Fill Traditional Chinese (tc) — all 260 keys |
| 19 | Fill Simplified Chinese (sc), Portuguese (pt), Japanese (ja) |
| 20 | Refactor cashier to import Locale from `@macau-pos/i18n` |

---

## Interpolation Examples

```typescript
// Simple
t(locale, "common.cancel")  // → "取消" (TC) / "Cancel" (EN)

// With params
interpolate(t(locale, "items.itemCount"), { count: 42 })
// → "目錄中有 42 件商品" (TC) / "42 items in catalog" (EN)

interpolate(t(locale, "items.deleteDescSingle"), { name: "Pocari Sweat" })
// → "「Pocari Sweat」將從目錄中移除。此操作無法撤銷。" (TC)
```

---

## Verification

1. **Type-safe**: Missing key in any locale = TypeScript compile error
2. **Visual**: Switch to each language, navigate every page — no English leaking
3. **Interpolation**: Verify counts, product names render correctly in all languages
4. **Persistence**: Reload page — locale preserved via cookie + localStorage
5. **Server metadata**: Page titles in browser tab match selected language
6. **Login page**: Respects locale cookie even before dashboard layout loads
7. **Cashier unaffected**: Cashier still works with its own translation keys
