# Storefront Section Library — Component Mapping

Maps Tailwind UI ecommerce blocks to merchant-configurable storefront sections.

## Architecture

Each section is:
1. A React Server Component in `apps/storefront/src/components/sections/`
2. Registered in the section renderer (`section-renderer.tsx`)
3. Configurable via `storefront_configs.homepageSections` JSONB
4. Toggleable + reorderable by merchant in admin

## Section Types (28 total, mapped from 14 Tailwind UI categories)

### Category 1: Product Lists (3 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `product_grid` | Product Lists | Responsive product grid (2/3/4 cols) | productIds[] or categoryId or "popular" |
| `product_list_simple` | Product Lists | Minimal list with image + name + price | productIds[] or auto |
| `product_carousel` | Product Lists | Horizontal scroll product row | productIds[] or categoryId |

### Category 2: Product Overviews (2 sections — used on product detail page, not homepage)
| Section Type | Used On | Description |
|---|---|---|
| `product_detail_split` | Product page | Image left, info right (desktop) |
| `product_detail_stacked` | Product page | Image top, info below (mobile) |

### Category 3: Category Previews (2 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `category_grid` | Category Previews | Card grid with icon/image + name | categoryIds[] or auto (all active) |
| `category_banner` | Category Previews | Full-width image cards per category | categoryIds[] with banner images |

### Category 4: Shopping Carts (2 — used on cart page/drawer, not homepage sections)
| Section Type | Used On | Description |
|---|---|---|
| `cart_page` | /cart route | Full cart with items, qty, totals |
| `cart_drawer` | Mobile overlay | Slide-up cart drawer |

### Category 5: Category Filters (1 — used on products page, not a section)
| Component | Used On | Description |
|---|---|---|
| `product_filters` | /products page | Sidebar/drawer filters (price, category, stock) |

### Category 6: Product Quickviews (1 — modal, not homepage section)
| Component | Used On | Description |
|---|---|---|
| `product_quickview` | Any product grid | Modal overlay with product preview + add-to-cart |

### Category 7: Product Features (2 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `feature_grid` | Product Features | Icon + title + description grid (3-4 cols) | items[{icon, title, description}] |
| `feature_split` | Product Features | Image + feature list side-by-side | image, features[{title, description}] |

### Category 8: Store Navigation (built into layout, not configurable sections)
| Component | Used On | Description |
|---|---|---|
| `storefront_header` | All pages | Top nav with logo, categories, search, cart, account |
| `mobile_nav` | Mobile | Hamburger menu slide-out |
| `breadcrumbs` | Product/category pages | Path navigation |

### Category 9: Promo Sections (4 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `hero_banner` | Promo Sections | Full-width image + title + CTA | image, title, subtitle, ctaText, ctaLink |
| `promo_banner` | Promo Sections | Colored banner with text + CTA (smaller than hero) | text, ctaText, ctaLink, bgColor |
| `sale_banner` | Promo Sections | Countdown/urgency banner for sales | title, endDate, ctaLink |
| `split_promo` | Promo Sections | Image left + text right (or vice versa) | image, title, body, ctaText, imagePosition |

### Category 10: Checkout Forms (used on /checkout page, not sections)
| Component | Used On | Description |
|---|---|---|
| `checkout_form` | /checkout | Contact + delivery + payment one-page form |
| `delivery_picker` | /checkout | Pickup vs delivery + zone selector |
| `payment_selector` | /checkout | MPay, Alipay, WeChat, Card selection |

### Category 11: Reviews (2 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `testimonials` | Reviews | Customer quote cards (carousel or grid) | items[{quote, author, avatar, rating}] |
| `review_summary` | Reviews | Star rating breakdown + recent reviews | productId (future: reviews table) |

### Category 12: Order Summaries (used on confirmation page, not sections)
| Component | Used On | Description |
|---|---|---|
| `order_confirmation` | /checkout/confirmation | Order number, items, total, next steps |

### Category 13: Order History (used on account pages, not sections)
| Component | Used On | Description |
|---|---|---|
| `order_list` | /account/orders | Past orders with status |
| `order_detail` | /account/orders/[id] | Full order with tracking timeline |

### Category 14: Incentives (2 sections)
| Section Type | Tailwind Ref | Description | Data Source |
|---|---|---|---|
| `incentive_grid` | Incentives | Icon + title + description (free shipping, 24h support, etc.) | items[{icon, title, description}] |
| `newsletter` | Incentives | Email signup form | title, subtitle, placeholder |

---

## Summary: What Goes Where

### Homepage Sections (merchant can add/reorder/toggle — 15 section types)
1. `hero_banner` — Full-width hero with CTA
2. `promo_banner` — Colored text banner
3. `sale_banner` — Urgency/countdown banner
4. `split_promo` — Image + text split layout
5. `product_grid` — Product cards grid
6. `product_list_simple` — Minimal product list
7. `product_carousel` — Horizontal scroll products
8. `category_grid` — Category cards
9. `category_banner` — Full-width category images
10. `feature_grid` — Feature/benefit icons grid
11. `feature_split` — Feature image + list
12. `testimonials` — Customer reviews/quotes
13. `incentive_grid` — Trust signals (free shipping, etc.)
14. `newsletter` — Email signup
15. `text_with_image` — Generic content block (existing)

### Custom Page Sections (merchant builds pages with these — same 15 + extras)
All homepage sections PLUS:
16. `rich_text` — Formatted text block
17. `faq_accordion` — Expandable Q&A
18. `contact_form` — Contact form with map
19. `image_gallery` — Grid of images
20. `video_embed` — YouTube/Vimeo embed

### Fixed Page Components (not configurable as sections — built into routes)
- Product detail layout (split/stacked)
- Cart page + cart drawer
- Checkout form + delivery picker + payment selector
- Product filters (sidebar/drawer)
- Product quickview modal
- Order confirmation
- Order history + detail
- Store header + footer + mobile nav + breadcrumbs

---

## Build Priority

**Batch 1 — Core (needed for working store):**
hero_banner, product_grid, category_grid, product_carousel, cart_page, cart_drawer, product_detail, checkout_form, product_filters

**Batch 2 — Marketing (drive sales):**
promo_banner, sale_banner, split_promo, testimonials, incentive_grid, feature_grid, newsletter

**Batch 3 — Content (custom pages):**
rich_text, faq_accordion, feature_split, category_banner, product_list_simple, text_with_image, image_gallery, video_embed, contact_form

**Batch 4 — Interactive:**
product_quickview, review_summary, order_list, order_detail, order_confirmation
