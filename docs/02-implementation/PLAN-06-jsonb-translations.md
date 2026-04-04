# Plan: JSONB Translation Architecture (v2)

**Author:** 🎭 Database Architect
**Date:** 2026-03-23
**Status:** Awaiting approval

---

## Problem

Product and category names are stored as **fixed columns per language** (name, name_cn, name_ja, name_pt). This is inflexible — adding new languages requires migrations, merchants can't choose their languages, and every product has empty columns for unused languages.

## Solution: Default Name + JSONB Translations

A **two-field approach**:

```
name          varchar(255) NOT NULL     -- Merchant's default name (any language they want)
translations  jsonb DEFAULT '{}'        -- Optional translations { "en": "...", "tc": "...", "ja": "..." }
```

**Key principle:**
- `name` = the product name. Always displayed. Not tied to any language.
- `translations` = optional alternative display names in other languages.

---

## How It Works

### Merchant creates a product:
```
name: "寶礦力水特 500ml"            -- THE name. Always shown by default.
translations: {
  "en": "Pocari Sweat 500ml",      -- Shown INSTEAD of name when user's locale = "en"
  "pt": "Pocari Sweat 500ml"       -- Shown INSTEAD of name when user's locale = "pt"
}
```

### Display logic:
```
translations[user_locale] exists?  → Show translation
translations[user_locale] missing? → Show name (as-is, no translation needed)
```

### Examples:
```
Product: name = "寶礦力水特", translations = { "en": "Pocari Sweat" }

User locale = "en"  → "Pocari Sweat"      (translation found)
User locale = "tc"  → "寶礦力水特"         (no translation → show name)
User locale = "ja"  → "寶礦力水特"         (no translation → show name)
User locale = "pt"  → "寶礦力水特"         (no translation → show name)

Product: name = "Häagen-Dazs", translations = {}

User locale = ANY   → "Häagen-Dazs"       (no translations → name is universal)
```

**The `name` is NOT a "default language" — it's just the name.** Like a brand name that doesn't change.

---

## Schema Changes

### 1. Tenants Table — Add locale config

```sql
ALTER TABLE tenants ADD COLUMN supported_locales text[] NOT NULL DEFAULT '{en}';
```

| Column | Type | Default | Example |
|--------|------|---------|---------|
| `supported_locales` | `text[]` | `'{en}'` | Languages the merchant wants translation fields for |

**Note:** No `default_locale` needed. The `name` field has no language — it's just the name. `supported_locales` only controls which optional translation inputs appear in the admin form.

### 2. Products Table

**Before:**
```
name      varchar(255) NOT NULL  -- English
name_cn   varchar(255)           -- Chinese
name_ja   varchar(255)           -- Japanese
name_pt   varchar(255)           -- Portuguese
```

**After:**
```
name           varchar(255) NOT NULL   -- Default name (any language)
translations   jsonb DEFAULT '{}'      -- { "en": "...", "tc": "...", "ja": "..." }
description    varchar(1000)           -- Default description (any language)
desc_translations  jsonb DEFAULT '{}'  -- { "en": "...", "tc": "..." }
```

**Drop:** `name_cn`, `name_ja`, `name_pt`

### 3. Categories Table

**Before:**
```
name      varchar(100) NOT NULL  -- Chinese primary
name_en   varchar(100)
name_pt   varchar(100)
name_ja   varchar(100)
```

**After:**
```
name           varchar(100) NOT NULL   -- Default name
translations   jsonb DEFAULT '{}'      -- { "en": "...", "pt": "...", "ja": "..." }
```

**Drop:** `name_en`, `name_pt`, `name_ja`

### 4. Order Items Table (Snapshots)

**Before:**
```
name      varchar(255) NOT NULL  -- English snapshot
name_cn   varchar(255)           -- Chinese snapshot
```

**After:**
```
name           varchar(255) NOT NULL   -- Default name snapshot
translations   jsonb DEFAULT '{}'      -- Full translations snapshot at purchase time
```

**Drop:** `name_cn`

---

## Helper Function

```typescript
// packages/database/src/utils.ts
export function getDisplayName(
  name: string,
  translations: Record<string, string> | null | undefined,
  locale: string,
): string {
  // If a translation exists for the user's locale, show it
  if (translations && translations[locale]) {
    return translations[locale];
  }
  // Otherwise, show the name as-is (no translation = no change)
  return name;
}
```

**Usage everywhere:**
```typescript
const displayName = getDisplayName(product.name, product.translations, userLocale);
// "寶礦力水特" + translations.en exists + user is EN → "Pocari Sweat 500ml"
// "寶礦力水特" + no JA translation + user is JA  → "寶礦力水特" (name as-is)
// "Häagen-Dazs" + no translations at all          → "Häagen-Dazs" (universal)
```

---

## Admin UI Changes

### Product Editor Form

```
┌─────────────────────────────────────────────────┐
│  Product name *                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 寶礦力水特 500ml                             │ │  ← THE name. Required. Any language.
│  └─────────────────────────────────────────────┘ │
│  This name is always displayed regardless of     │
│  system language.                                 │
│                                                   │
│  Translations (optional)                          │
│  ┌──────────┬──────────────────────────────────┐ │
│  │ English  │ Pocari Sweat 500ml               │ │  ← Shown INSTEAD of name
│  ├──────────┼──────────────────────────────────┤ │     when user's locale matches
│  │ Português│ Pocari Sweat 500ml               │ │
│  └──────────┴──────────────────────────────────┘ │
│                                                   │
│  ▸ Add translation (Japanese, Korean...)          │  ← From tenant.supported_locales
└─────────────────────────────────────────────────┘
```

- The form reads `tenant.supported_locales` to determine which translation fields to show
- Translations are all optional — if a merchant doesn't add English, English users just see the default name
- "Häagen-Dazs" needs zero translations — it's universal

---

## Data Migration

### Migrate existing products (350 items):

```sql
-- Step 1: Add new columns
ALTER TABLE products ADD COLUMN translations jsonb DEFAULT '{}';

-- Step 2: Populate translations from old columns
UPDATE products SET translations = (
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'en', CASE WHEN name IS NOT NULL THEN name END,
    'tc', CASE WHEN name_cn IS NOT NULL THEN name_cn END,
    'ja', CASE WHEN name_ja IS NOT NULL THEN name_ja END,
    'pt', CASE WHEN name_pt IS NOT NULL THEN name_pt END
  ))
);

-- Step 3: Set default name to Chinese name (since most products are from YP.mo)
UPDATE products SET name = COALESCE(name_cn, name) WHERE name_cn IS NOT NULL;

-- Step 4: Remove the Chinese entry from translations (it's now the default)
UPDATE products SET translations = translations - 'tc';

-- Step 5: Drop old columns (after code is updated)
ALTER TABLE products DROP COLUMN name_cn, DROP COLUMN name_ja, DROP COLUMN name_pt;
```

### Migrate categories:

```sql
ALTER TABLE categories ADD COLUMN translations jsonb DEFAULT '{}';
UPDATE categories SET translations = jsonb_strip_nulls(jsonb_build_object(
  'en', name_en, 'pt', name_pt, 'ja', name_ja
));
-- name stays as the default (already Chinese)
ALTER TABLE categories DROP COLUMN name_en, DROP COLUMN name_pt, DROP COLUMN name_ja;
```

### Migrate order items:

```sql
ALTER TABLE order_items ADD COLUMN translations jsonb DEFAULT '{}';
UPDATE order_items SET translations = jsonb_strip_nulls(jsonb_build_object(
  'tc', name_cn
));
-- name stays as English default
ALTER TABLE order_items DROP COLUMN name_cn;
```

---

## Affected Files (16)

### Schema (4 files)
| File | Change |
|------|--------|
| `schema/tenants.ts` | Add `defaultLocale`, `supportedLocales` |
| `schema/products.ts` | Replace 3 name cols with `translations jsonb` |
| `schema/categories.ts` | Replace 3 name cols with `translations jsonb` |
| `schema/order-items.ts` | Replace `nameCn` with `translations jsonb` |

### Database Package (3 files)
| File | Change |
|------|--------|
| `utils.ts` | New: `getLocalizedName()` |
| `seed.ts` | Update seed to JSONB format |
| `index.ts` | Export utils |

### Admin App (5 files)
| File | Change |
|------|--------|
| `lib/queries.ts` | Return `translations` field |
| `lib/product-actions.ts` | Accept translations JSONB |
| `lib/category-actions.ts` | Accept translations JSONB |
| `items/product-editor.tsx` | Dynamic translation inputs based on tenant locales |
| `items/items-client.tsx` | Use `getLocalizedName()` for table display |

### Cashier App (3 files)
| File | Change |
|------|--------|
| `lib/queries.ts` | Return `translations` field |
| `lib/actions.ts` | Snapshot translations into order items |
| `app/pos-client.tsx` | Use `getLocalizedName()` |

### Shared (1 file)
| File | Change |
|------|--------|
| `packages/i18n/src/utils.ts` | Export `getLocalizedName()` |

---

## Build Order

| Step | Task |
|------|------|
| 1 | Update Drizzle schema (4 tables) |
| 2 | Run `db:generate` + `db:migrate` |
| 3 | Write + run data migration script |
| 4 | Create `getLocalizedName()` utility |
| 5 | Update admin queries + server actions |
| 6 | Update product editor (dynamic locale inputs) |
| 7 | Update cashier queries + display |
| 8 | Update order item snapshot |
| 9 | Update seed data |
| 10 | Drop old columns (cleanup migration) |

---

## Verification

1. Create product with default name "寶礦力水特" + English translation "Pocari Sweat"
2. Admin table shows correct name per current locale
3. Cashier shows correct name per current locale
4. Search works across default name AND all translations
5. Order snapshot preserves both default + translations at purchase time
6. Merchant adds Japanese to supported_locales → Japanese input appears in editor
7. Seed data loads correctly with new format
8. 350 imported products migrated: Chinese as default, English as translation
