#!/usr/bin/env python3
"""Import 853mask products from backup JSON into the database."""

import json
import re
import uuid
import psycopg2

DB_URL = "postgresql://pos_dev:pos_dev_123@localhost:5433/macau_pos_dev"
TENANT_ID = "bc2e9011-dd29-4624-9cb3-d5d1ac288382"
BACKUP_FILE = "docs/853mask-products-backup.json"

# Category classification rules (order matters — first match wins)
CATEGORY_RULES = [
    (r"KF94|KN95", "KF94/KN95 立體口罩", "kf94-kn95"),
    (r"3D|立體", "3D 立體型口罩", "3d-mask"),
    (r"中童|兒童|145mm|145MM", "中童口罩", "kids-mask"),
    (r"冰極薄荷|UltraFRIO|ULTRAFRIO", "冰極薄荷系列", "ultra-frio"),
    (r"50片|盒裝50|50入", "盒裝50片", "box-50"),
    (r"Level\s*1|LEVEL\s*1|L1", "ASTM Level 1", "astm-level-1"),
    (r"Level\s*2|LEVEL\s*2|L2", "ASTM Level 2", "astm-level-2"),
    (r"Level\s*3|LEVEL\s*3|L3", "ASTM Level 3", "astm-level-3"),
    (r"三層|一次性", "一次性口罩", "disposable"),
]
DEFAULT_CATEGORY = ("其他", "others")


def classify(name):
    for pattern, cat_name, cat_slug in CATEGORY_RULES:
        if re.search(pattern, name, re.IGNORECASE):
            return cat_name, cat_slug
    return DEFAULT_CATEGORY


def slugify(name):
    """Create a URL-friendly slug from product name."""
    # Remove special chars, lowercase, replace spaces with hyphens
    s = re.sub(r'[^\w\s\u4e00-\u9fff-]', '', name).strip().lower()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s[:200]


def main():
    with open(BACKUP_FILE, "r") as f:
        data = json.load(f)

    products = data["products"]
    print(f"Loaded {len(products)} products from backup")

    # Collect unique categories
    cat_map = {}  # name -> slug
    for p in products:
        cat_name, cat_slug = classify(p["name"])
        cat_map[cat_name] = cat_slug

    print(f"Categories to create: {list(cat_map.keys())}")

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        cur = conn.cursor()

        # Step 1: Insert categories (separate commit)
        cat_ids = {}  # name -> uuid
        for sort_idx, (cat_name, cat_slug) in enumerate(cat_map.items()):
            cat_id = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO categories (id, tenant_id, name, slug, sort_order, is_active)
                   VALUES (%s, %s, %s, %s, %s, true)
                   ON CONFLICT (tenant_id, slug) WHERE slug IS NOT NULL
                   DO UPDATE SET name = EXCLUDED.name
                   RETURNING id""",
                (cat_id, TENANT_ID, cat_name, cat_slug, sort_idx),
            )
            row = cur.fetchone()
            cat_ids[cat_name] = row[0]

        conn.commit()
        print(f"Committed {len(cat_ids)} categories")

        # Step 2: Insert products with savepoints
        inserted = 0
        errors = []
        for idx, p in enumerate(products):
            cat_name, _ = classify(p["name"])
            category_id = cat_ids.get(cat_name)

            price = p.get("price", "0")
            try:
                price_val = float(price)
            except (ValueError, TypeError):
                price_val = 0.0

            name = p.get("content_name") or p.get("name") or "Unknown"
            slug = slugify(name)
            # Ensure unique slug by appending index if needed
            slug = f"{slug}-{idx}" if idx > 0 else slug

            image = p.get("image")
            all_images = p.get("all_images", [])
            images_json = json.dumps([{"url": img, "alt": name} for img in all_images])

            description = (p.get("description") or "")[:1000]
            stock_status = p.get("stock_status", "in_stock")
            status = "active" if stock_status == "in_stock" else "inactive"

            savepoint = f"sp_{idx}"
            try:
                cur.execute(f"SAVEPOINT {savepoint}")
                cur.execute(
                    """INSERT INTO products
                       (id, tenant_id, category_id, name, slug, image, images, selling_price,
                        stock, status, sort_order, description)
                       VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s)""",
                    (
                        str(uuid.uuid4()),
                        TENANT_ID,
                        category_id,
                        name[:255],
                        slug[:200],
                        image,
                        images_json,
                        price_val,
                        None,  # stock unknown
                        status,
                        idx,
                        description,
                    ),
                )
                cur.execute(f"RELEASE SAVEPOINT {savepoint}")
                inserted += 1
            except Exception as e:
                cur.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
                errors.append((name[:60], str(e)[:100]))
                print(f"  Error [{idx}] {name[:50]}: {e}")

        conn.commit()
        print(f"\nDone: {inserted}/{len(products)} products inserted, {len(errors)} errors")
        if errors:
            print("\nErrors:")
            for name, err in errors:
                print(f"  - {name}: {err}")

    except Exception as e:
        conn.rollback()
        print(f"Fatal error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
