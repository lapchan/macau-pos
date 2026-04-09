#!/usr/bin/env bash
# Scrape all Savewo products from sitemap using JSON-LD structured data
set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/packages/database/src/data"
URLS_FILE="/tmp/savewo-urls.txt"
OUT_FILE="$OUT_DIR/savewo-full-catalog.json"

echo "==> Fetching sitemap..."
curl -s https://store.savewo.com/sitemap.xml | grep -o 'https://store.savewo.com/products/[^<]*' > "$URLS_FILE"
TOTAL=$(wc -l < "$URLS_FILE" | tr -d ' ')
echo "==> Found $TOTAL product URLs"

echo "[" > "$OUT_FILE"
COUNT=0
FIRST=true

while IFS= read -r url; do
  COUNT=$((COUNT + 1))
  SLUG=$(echo "$url" | sed 's|.*/products/||')

  # Fetch page HTML
  HTML=$(curl -sL "$url")

  # Extract product JSON-LD using python (more robust than sed)
  RESULT=$(echo "$HTML" | python3 -c "
import sys, json, re

html = sys.stdin.read()
# Find all JSON-LD blocks
blocks = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)

for block in blocks:
    try:
        data = json.loads(block.strip())
        if data.get('@type') == 'Product':
            images = data.get('image', [])
            if isinstance(images, str):
                images = [images]
            # Clean image URLs (remove query params)
            clean_images = [img.split('?')[0] for img in images]
            out = {
                'slug': '$SLUG',
                'name': data.get('name', ''),
                'sku': data.get('sku', ''),
                'description': (data.get('description', '') or '')[:300],
                'price': data.get('offers', {}).get('price', 0),
                'currency': data.get('offers', {}).get('priceCurrency', 'HKD'),
                'availability': 'InStock' if 'InStock' in str(data.get('offers', {}).get('availability', '')) else 'OutOfStock',
                'images': clean_images,
            }
            json.dump(out, sys.stdout, ensure_ascii=False)
            break
    except:
        pass
" 2>/dev/null || true)

  if [ -z "$RESULT" ]; then
    echo "  [$COUNT/$TOTAL] SKIP: $SLUG"
    continue
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> "$OUT_FILE"
  fi

  echo "$RESULT" >> "$OUT_FILE"
  echo "  [$COUNT/$TOTAL] OK: $SLUG"

  sleep 0.3
done < "$URLS_FILE"

echo "" >> "$OUT_FILE"
echo "]" >> "$OUT_FILE"

echo ""
echo "==> Done! Saved to $OUT_FILE"
