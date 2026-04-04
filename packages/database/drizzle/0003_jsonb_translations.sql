-- Migration: JSONB Translation Architecture
-- Replaces fixed language columns with name + translations JSONB pattern

-- 1. Tenants: Add supported_locales
ALTER TABLE "tenants" ADD COLUMN "supported_locales" text[] NOT NULL DEFAULT '{en}';

-- 2. Products: Add new columns
ALTER TABLE "products" ADD COLUMN "translations" jsonb DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN "description" varchar(1000);
ALTER TABLE "products" ADD COLUMN "desc_translations" jsonb DEFAULT '{}';

-- 3. Products: Migrate data from old columns into translations JSONB
-- The current `name` column has English names, name_cn has Chinese
-- We want: name = Chinese (merchant's default), translations = { "en": old English name }
UPDATE "products" SET
  "translations" = jsonb_strip_nulls(jsonb_build_object(
    'en', CASE WHEN "name" IS NOT NULL AND "name" != '' THEN "name" END,
    'ja', "name_ja",
    'pt', "name_pt"
  )),
  "name" = COALESCE(NULLIF("name_cn", ''), "name")
WHERE "name_cn" IS NOT NULL AND "name_cn" != '';

-- For products without Chinese name, keep English as the name
UPDATE "products" SET
  "translations" = jsonb_strip_nulls(jsonb_build_object(
    'ja', "name_ja",
    'pt', "name_pt"
  ))
WHERE "name_cn" IS NULL OR "name_cn" = '';

-- 4. Products: Drop old columns
ALTER TABLE "products" DROP COLUMN IF EXISTS "name_cn";
ALTER TABLE "products" DROP COLUMN IF EXISTS "name_ja";
ALTER TABLE "products" DROP COLUMN IF EXISTS "name_pt";

-- 5. Categories: Add translations column
ALTER TABLE "categories" ADD COLUMN "translations" jsonb DEFAULT '{}';

-- 6. Categories: Migrate data
UPDATE "categories" SET
  "translations" = jsonb_strip_nulls(jsonb_build_object(
    'en', "name_en",
    'pt', "name_pt",
    'ja', "name_ja"
  ));

-- 7. Categories: Drop old columns
ALTER TABLE "categories" DROP COLUMN IF EXISTS "name_en";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "name_pt";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "name_ja";

-- 8. Order items: Add translations column
ALTER TABLE "order_items" ADD COLUMN "translations" jsonb DEFAULT '{}';

-- 9. Order items: Migrate data
UPDATE "order_items" SET
  "translations" = jsonb_strip_nulls(jsonb_build_object(
    'tc', "name_cn"
  ))
WHERE "name_cn" IS NOT NULL AND "name_cn" != '';

-- 10. Order items: Drop old column
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "name_cn";
