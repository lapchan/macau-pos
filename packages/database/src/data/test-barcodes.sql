-- ─────────────────────────────────────────────────────────────
-- Test barcodes for hardware scanner verification (CountingStars)
-- ─────────────────────────────────────────────────────────────
-- Assigns 10 valid EAN-13 barcodes to the first 10 active products
-- (ordered by sort_order, name) so we have something to scan against.
--
-- The 200x prefix is reserved for "in-store / not GTIN-registered" use,
-- so these will never collide with real product barcodes.
--
-- Run from a psql session connected to the production DB:
--   \i packages/database/src/data/test-barcodes.sql
--
-- The companion print page lives at /barcodes-test.html on the cashier
-- subdomain (pos.hkretailai.com/barcodes-test.html).
-- ─────────────────────────────────────────────────────────────

BEGIN;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, name) AS rn
  FROM products
  WHERE tenant_id = 'fcf07b48-fe21-4ec2-ad72-56481f918883'
    AND deleted_at IS NULL
    AND status = 'active'
)
UPDATE products p
SET barcode = CASE r.rn
  WHEN  1 THEN '2000000000015'
  WHEN  2 THEN '2000000000022'
  WHEN  3 THEN '2000000000039'
  WHEN  4 THEN '2000000000046'
  WHEN  5 THEN '2000000000053'
  WHEN  6 THEN '2000000000060'
  WHEN  7 THEN '2000000000077'
  WHEN  8 THEN '2000000000084'
  WHEN  9 THEN '2000000000091'
  WHEN 10 THEN '2000000000107'
END
FROM ranked r
WHERE p.id = r.id AND r.rn <= 10;

-- Show the resulting mapping so you know which physical barcode = which product
SELECT
  ROW_NUMBER() OVER (ORDER BY barcode) AS slot,
  barcode,
  name,
  selling_price
FROM products
WHERE tenant_id = 'fcf07b48-fe21-4ec2-ad72-56481f918883'
  AND barcode LIKE '200000000%'
ORDER BY barcode;

COMMIT;

-- ─── To revert ────────────────────────────────────────────────
-- UPDATE products
--   SET barcode = NULL
-- WHERE tenant_id = 'fcf07b48-fe21-4ec2-ad72-56481f918883'
--   AND barcode LIKE '200000000%';
