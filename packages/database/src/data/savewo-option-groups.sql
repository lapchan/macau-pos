-- Generate option_groups + option_values from product_variants.option_combo


DO $$
DECLARE
  prod RECORD;
  variant RECORD;
  grp_id UUID;
  sort_idx INT;
  existing_count INT;
BEGIN
  FOR prod IN
    SELECT id, slug FROM products 
    WHERE has_variants = true AND deleted_at IS NULL AND tenant_id = 'fcf07b48-fe21-4ec2-ad72-56481f918883'
  LOOP
    -- Check if option_group already exists for this product
    SELECT count(*) INTO existing_count FROM option_groups WHERE product_id = prod.id;
    IF existing_count > 0 THEN
      CONTINUE;
    END IF;

    -- Create option_group "Color"
    grp_id := gen_random_uuid();
    INSERT INTO option_groups (id, tenant_id, product_id, name, translations, sort_order)
    VALUES (grp_id, 'fcf07b48-fe21-4ec2-ad72-56481f918883', prod.id, 'Color', '{"en": "Color", "tc": "顏色", "sc": "颜色", "pt": "Cor", "ja": "カラー"}', 0);

    -- Create option_values for each unique color
    sort_idx := 0;
    FOR variant IN
      SELECT DISTINCT option_combo->>'Color' as color_name
      FROM product_variants
      WHERE product_id = prod.id AND is_active = true
      ORDER BY option_combo->>'Color'
    LOOP
      INSERT INTO option_values (id, group_id, value, translations, sort_order)
      VALUES (gen_random_uuid(), grp_id, variant.color_name, NULL, sort_idx);
      sort_idx := sort_idx + 1;
    END LOOP;

    RAISE NOTICE 'Created % option values for %', sort_idx, prod.slug;
  END LOOP;
END $$;
