# Plan: Product Variants with Option Groups + Full YP.mo Import

## Context
CountingStars' catalog has ~230 products from YP.mo, mostly Savewo mask variants (same mask in sizes S/M/L/XL, colors 黑/灰/白/藍). Currently each variant is a separate product row, cluttering the catalog. The user chose **Shopify-style option groups** — the most flexible variant system. This plan also imports all remaining products from the pasted data.

**Design principle:** `name` = default product name (merchant's language). `translations` = optional JSONB for other languages. Variants inherit parent's name but append option values.

---

## New Database Tables (3)

### 1. `option_groups` — Defines what options a product has
```
option_groups
  id            uuid PK
  tenant_id     uuid FK → tenants (cascade)
  product_id    uuid FK → products (cascade)
  name          varchar(100)    — "Size", "Color", "尺寸", "顏色"
  translations  jsonb           — { "en": "Size", "ja": "サイズ" }
  sort_order    int default 0
  created_at    timestamp
```
Index: `(product_id, sort_order)`

### 2. `option_values` — The choices within each option group
```
option_values
  id            uuid PK
  group_id      uuid FK → option_groups (cascade)
  value         varchar(100)    — "S", "M", "L", "XL", "Black", "White"
  translations  jsonb           — { "en": "Small", "ja": "Sサイズ" }
  sort_order    int default 0
```
Index: `(group_id, sort_order)`

### 3. `product_variants` — Actual purchasable SKU combinations
```
product_variants
  id            uuid PK
  tenant_id     uuid FK → tenants (cascade)
  product_id    uuid FK → products (cascade)
  sku           varchar(100) nullable
  barcode       varchar(100) nullable
  name          varchar(255)    — Auto-generated: "SAVEWO 3DMASK Kuro - M / 暗魂黑"
  selling_price decimal(10,2)   — Override price (or same as parent)
  original_price decimal(10,2) nullable
  stock         int nullable    — null = use parent's stock, or variant-level stock
  image         varchar(500) nullable — Override image for this variant
  option_combo  jsonb NOT NULL  — { "Size": "M", "Color": "暗魂黑" }
  is_active     boolean default true
  sort_order    int default 0
  created_at    timestamp
  updated_at    timestamp
```
Indexes: `(product_id, is_active)`, `(tenant_id, sku)`, `(tenant_id, barcode)`

---

## Modified Tables (2)

### 4. `products` — Add variant flag
```
+ has_variants   boolean NOT NULL default false
```
When `has_variants = true`:
- The product's own `sellingPrice` and `stock` are the **default/base** values
- Actual purchasable items are in `product_variants`
- Cashier shows variant picker when tapping this product

### 5. `order_items` — Track which variant was purchased
```
+ variant_id    uuid FK → product_variants (set null on delete) nullable
+ variant_name  varchar(255) nullable   — Snapshot: "M / 暗魂黑"
+ option_combo  jsonb nullable          — Snapshot: { "Size": "M", "Color": "暗魂黑" }
```

---

## Display Logic

### Cashier (POS Grid)
```
Product card shows:
  - Parent product name + image
  - Price range if variants have different prices: "MOP 59 – 189"
  - "X variants" badge

On tap:
  IF has_variants = false → add directly to cart (current behavior)
  IF has_variants = true  → show variant picker modal:
    - Option group dropdowns/chips (Size: [S] [M] [L] [XL])
    - Selected combo shows: price, stock, image
    - "Add to cart" button
```

### Admin (Product Editor)
```
Bottom of the product editor form:
  Toggle: "This product has variants"

  IF enabled:
    - Option groups section: Add/edit groups (Size, Color)
    - Each group: Add/edit values (S, M, L, XL)
    - Variant table auto-generates from combinations
    - Each variant row: SKU, barcode, price, stock, image override
    - Can edit individual variant prices/stock
```

### getDisplayName for Variants
```typescript
// Cart item name:
"SAVEWO 3DMASK Kuro · M / 暗魂黑"
// = parent.name + " · " + variant.optionCombo values joined by " / "
```

---

## Import Strategy for YP.mo Data

The ~230 products from the pasted data will be imported as:

1. **Group masks by base product name** — detect shared prefix
   - "SAVEWO 3DMASK Kuro Collection暗魂黑 DarkSoul Black（30片獨立包裝/盒）標準碼 Medium Size"
   - "SAVEWO 3DMASK Kuro Collection城堡灰 Castle Grey（30片獨立包裝/盒）標準碼 Medium Size"
   - → Parent: "SAVEWO 3DMASK Kuro Collection" with variants: 暗魂黑 M, 城堡灰 M, etc.

2. **Non-mask products** → Import as simple products (has_variants = false)

3. **Products with `規格貨品明細`** → These already have variant pricing in YP.mo's format
   - e.g. labubu: `{$350,0.000,350.00}；{$388,0.000,388.00,6b911ba}`
   - Parse these into option groups + variants

**Phase 1 (now):** Import all 230 products as flat products (no grouping yet). This gets the data in.
**Phase 2 (later):** Admin UI to "group" existing products into parent + variants. Or auto-detect groups.

---

## Build Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create 3 new schema files | `option-groups.ts`, `option-values.ts`, `product-variants.ts` |
| 2 | Add `has_variants` to products schema | `products.ts` |
| 3 | Add variant columns to order-items | `order-items.ts` |
| 4 | Update schema index | `index.ts` |
| 5 | Run db:generate + db:migrate | migration |
| 6 | Write full import script for all 230 products | `import-yp-full.ts` |
| 7 | Run import | script execution |
| 8 | Add variant CRUD server actions | `variant-actions.ts` |
| 9 | Add variant section to product editor | `product-editor.tsx` |
| 10 | Add variant picker to cashier | `pos-client.tsx` |
| 11 | Update createOrder to include variant info | `actions.ts` |
| 12 | Update admin queries for variants | `queries.ts` |

---

## i18n Keys (New)

| Key | EN | TC |
|-----|----|----|
| `items.hasVariants` | This product has variants | 此商品有多個規格 |
| `items.optionGroups` | Option groups | 規格分組 |
| `items.addOptionGroup` | Add option group | 新增規格分組 |
| `items.optionValues` | Values | 選項 |
| `items.variants` | Variants | 規格明細 |
| `items.variantCount` | {count} variants | {count} 個規格 |
| `items.priceRange` | {min} – {max} | {min} – {max} |
| `items.selectOptions` | Select options | 選擇規格 |

---

## Verification

1. **Schema:** `db:generate` + `db:migrate` creates 3 new tables + 2 column additions
2. **Import:** All 230 products from pasted data imported into DB
3. **Admin view:** Products page shows all products, "has_variants" badge where applicable
4. **Admin edit:** Toggle variants on a product → add Size group → add S/M/L values → variant table auto-generates
5. **Cashier:** Tap product with variants → picker shows → select options → add to cart with variant info
6. **Order:** Completed order shows variant name in order_items (e.g., "SAVEWO 3DMASK · M / 暗魂黑")
7. **Order history:** Variant info persisted as snapshot in order_items
