#!/usr/bin/env bash
# Download all Savewo product images for cashier (1st image) and storefront (all images)
set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
CATALOG="$PROJECT/packages/database/src/data/savewo-full-catalog.json"
CASHIER_DIR="$PROJECT/apps/cashier/public/products/savewo"
STORE_DIR="$PROJECT/apps/storefront/public/products/savewo"

mkdir -p "$CASHIER_DIR" "$STORE_DIR"

TOTAL=$(python3 -c "import json; d=json.load(open('$CATALOG')); print(len(d))")
echo "==> Downloading images for $TOTAL products..."

python3 << 'PYEOF'
import json, os, subprocess, sys

catalog = json.load(open(os.environ.get("CATALOG", ""), "r") if os.environ.get("CATALOG") else sys.exit(1))
cashier_dir = os.environ.get("CASHIER_DIR", "")
store_dir = os.environ.get("STORE_DIR", "")

total = len(catalog)
img_count = 0
skip_count = 0

for i, p in enumerate(catalog):
    slug = p["slug"]
    images = p.get("images", [])
    if not images:
        print(f"  [{i+1}/{total}] SKIP (no images): {slug}")
        continue

    for j, img_url in enumerate(images):
        ext = "jpg"
        # File names: slug.jpg for first, slug-2.jpg, slug-3.jpg etc
        suffix = "" if j == 0 else f"-{j+1}"
        filename = f"{slug}{suffix}.{ext}"

        # Storefront: download all images
        store_path = os.path.join(store_dir, filename)
        if not os.path.exists(store_path):
            # Download at 540px width for storefront
            dl_url = img_url.replace("/original.", "/540x.") if "/original." in img_url else img_url
            result = subprocess.run(
                ["curl", "-sL", "-o", store_path, "--max-time", "10", dl_url],
                capture_output=True
            )
            if result.returncode == 0 and os.path.exists(store_path) and os.path.getsize(store_path) > 1000:
                img_count += 1
            else:
                # Fallback to original size
                subprocess.run(["curl", "-sL", "-o", store_path, "--max-time", "10", img_url], capture_output=True)
                if os.path.exists(store_path) and os.path.getsize(store_path) > 1000:
                    img_count += 1
                else:
                    if os.path.exists(store_path):
                        os.remove(store_path)
                    skip_count += 1
                    continue

        # Cashier: only first image
        if j == 0:
            cashier_path = os.path.join(cashier_dir, filename)
            if not os.path.exists(cashier_path):
                # Download at 300px for cashier (smaller)
                dl_url = img_url.replace("/original.", "/300x.") if "/original." in img_url else img_url
                subprocess.run(["curl", "-sL", "-o", cashier_path, "--max-time", "10", dl_url], capture_output=True)
                if not (os.path.exists(cashier_path) and os.path.getsize(cashier_path) > 1000):
                    # Fallback
                    subprocess.run(["curl", "-sL", "-o", cashier_path, "--max-time", "10", img_url], capture_output=True)

    print(f"  [{i+1}/{total}] OK: {slug} ({len(images)} imgs)")

print(f"\n==> Done! Downloaded {img_count} new images, {skip_count} skipped")
PYEOF
