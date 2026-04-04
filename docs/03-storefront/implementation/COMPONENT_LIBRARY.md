# Storefront Component Library

## 1. Overview

This document catalogs all UI components built for the **macau-pos storefront** app (`apps/storefront/`). The components are based on **Tailwind Plus ecommerce blocks** (formerly Tailwind UI) and adapted for the Macau market with multi-language support, MOP currency, and local payment methods.

**Total component count: 37 components** across 6 directories:

| Directory | Count | Purpose |
|---|---|---|
| `sections/` | 22 | Homepage section blocks (DB-configurable) |
| `layout/` | 2 | Store header and footer |
| `product/` | 5 | Product display, filtering, reviews |
| `cart/` | 3 | Shopping cart (drawer, page, item row) |
| `checkout/` | 2 | Checkout form and order confirmation |
| `account/` | 2 | Login and order history |

---

## 2. Architecture

### Component Organization

```
components/
  sections/           # DB-configurable homepage sections
    section-renderer.tsx   # Orchestrator — maps SectionConfig[] to components
    hero-banner.tsx        # 21 individual section components
    ...
  layout/             # Persistent layout (header/footer)
    store-header.tsx
    store-footer.tsx
  product/            # Product detail page components
    product-card.tsx
    product-overview.tsx
    product-quickview.tsx
    product-reviews.tsx
    category-filter-sidebar.tsx
  cart/               # Cart components
    cart-drawer.tsx
    cart-item-row.tsx
    cart-page-view.tsx
  checkout/           # Checkout flow components
    checkout-form.tsx
    order-confirmation.tsx
  account/            # Account/auth components
    login-form.tsx
    order-history-list.tsx
```

### Server vs Client Components

| Type | Components |
|---|---|
| **Server Components** (async, fetch data) | `ProductGrid`, `ProductCarousel`, `ProductListSimple`, `CategoryGrid`, `CategoryBanner`, `CategoryScroll`, `ProductReviews`, `SectionRenderer`, `StoreFooter`, most static sections |
| **Client Components** (`"use client"`) | `StoreHeader`, `SaleBanner`, `Newsletter`, `FaqAccordion`, `CartDrawer`, `CartItemRow`, `CartPageView`, `CheckoutForm`, `LoginForm`, `ProductOverview`, `ProductQuickview`, `CategoryFilterSidebar` |

### Data Flow

1. **Tenant resolution**: `[locale]/layout.tsx` resolves the tenant via `resolveTenant()`, loads storefront config and categories.
2. **Section config**: `[locale]/page.tsx` reads `config.homepageSections` (a `SectionConfig[]` from the DB). Falls back to hardcoded defaults if empty.
3. **Section rendering**: `SectionRenderer` iterates enabled sections, looks up the component from `SECTION_MAP`, and passes `{ data, locale, tenantId }`.
4. **Product data**: Server components like `ProductGrid` call `getStorefrontProducts()` directly during render.
5. **Categories**: Loaded once in layout, passed to header/footer as props. Section components fetch independently.

---

## 3. Component Inventory

### 3.1 Layout Components

#### StoreHeader

- **File**: `apps/storefront/src/components/layout/store-header.tsx`
- **Type**: Client Component
- **Props**: `locale`, `tenantName`, `tenantLogo?`, `accentColor`, `categories[]`, `cartCount?`
- **i18n**: tc, sc, en, pt, ja (5 languages)
- **Description**: Full-width dark navigation header with top bar (language selector, sign-in links) and secondary nav (logo, category flyout links, search, help, cart icon). Includes a slide-out mobile menu with category links and account links. Language switcher reloads the page with the new locale prefix.
- **Usage**:
```jsx
<StoreHeader
  locale="tc"
  tenantName="My Store"
  tenantLogo="/logo.png"
  accentColor="#0071e3"
  categories={categories}
  cartCount={3}
/>
```

#### StoreFooter

- **File**: `apps/storefront/src/components/layout/store-footer.tsx`
- **Type**: Server Component
- **Props**: `locale`, `tenantName`, `categories[]`
- **i18n**: tc, sc, en, pt, ja
- **Description**: Dark footer with four-column link grid (Shop, Company, Account, Connect) plus a newsletter signup form. Categories are dynamically rendered from props. Includes copyright line with dynamic year.
- **Usage**:
```jsx
<StoreFooter locale="en" tenantName="My Store" categories={categories} />
```

---

### 3.2 Section Components

All section components share the same props signature:

```typescript
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };
```

#### HeroBanner

- **File**: `apps/storefront/src/components/sections/hero-banner.tsx`
- **Type**: Server Component
- **Key data props**: `image`, `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `ctaText`, `ctaTranslations`, `ctaLink`, `overlayOpacity` (0-1), `height` (sm/md/lg/xl/full)
- **Variants**: 5 height variants (sm, md, lg, xl, full-screen)
- **i18n**: Supports per-field translation objects
- **Description**: Full-width hero with background image, dark overlay, centered white text (title + subtitle), and a white CTA button. Based on Tailwind Plus "With dark background" hero.

#### PromoBanner

- **File**: `apps/storefront/src/components/sections/promo-banner.tsx`
- **Type**: Server Component
- **Key data props**: `text`, `textTranslations`, `ctaText`, `ctaTranslations`, `ctaLink`, `bgColor`, `textColor`
- **Description**: Slim announcement bar with centered text and optional pill-shaped CTA button. Configurable background and text colors.

#### SaleBanner

- **File**: `apps/storefront/src/components/sections/sale-banner.tsx`
- **Type**: Client Component (uses `useEffect` for countdown timer)
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `endDate` (ISO string), `ctaLink`, `bgColor`
- **Description**: Bold sale banner with countdown timer. Displays days/hours/minutes (or hours/minutes/seconds when under 1 day). Timer auto-hides when expired. Includes "Shop Now" CTA in 4 languages.

#### SplitPromo

- **File**: `apps/storefront/src/components/sections/split-promo.tsx`
- **Type**: Server Component
- **Key data props**: `image`, `title`, `titleTranslations`, `body`, `bodyTranslations`, `ctaText`, `ctaTranslations`, `ctaLink`, `imagePosition` (left/right)
- **Description**: Two-column layout with text on one side and image (4:3 aspect) on the other. Image position is configurable. Shows placeholder when no image provided.

#### FeatureGrid

- **File**: `apps/storefront/src/components/sections/feature-grid.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `items[]` (icon, title, titleTranslations, description, descTranslations), `columns` (2/3/4)
- **Icons**: truck, shield, clock, star, gift, heart
- **Description**: Centered icon grid with title + description per feature. Configurable 2/3/4 column layout. Icons rendered as SVG paths from a built-in icon map.

#### FeatureSplit

- **File**: `apps/storefront/src/components/sections/feature-split.tsx`
- **Type**: Server Component
- **Key data props**: `image`, `title`, `titleTranslations`, `features[]` (title, titleTranslations, description, descTranslations), `imagePosition` (left/right)
- **Description**: Split layout with image on one side and a definition list of features on the other. Based on Tailwind Plus "With split image" product features.

#### Testimonials

- **File**: `apps/storefront/src/components/sections/testimonials.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `items[]` (quote, quoteTranslations, author, role?, avatar?, rating?)
- **Description**: 3-column grid of testimonial cards with star ratings, quoted text, author avatar (or initial), and role. Renders on a surface-colored background.

#### IncentiveGrid

- **File**: `apps/storefront/src/components/sections/incentive-grid.tsx`
- **Type**: Server Component
- **Key data props**: `items[]` (icon, title, titleTranslations, description, descTranslations)
- **Icons**: truck, shield, clock, refresh (+ star fallback)
- **Description**: Horizontal strip with 4-column icon + text layout. Bordered top and bottom, surface background. Based on Tailwind Plus "4-column with illustrations" incentives.

#### Newsletter

- **File**: `apps/storefront/src/components/sections/newsletter.tsx`
- **Type**: Client Component
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `placeholder`, `placeholderTranslations`
- **Description**: Centered email signup form with input + submit button. Subscribe button auto-translates to 4 languages. Form submission is a TODO placeholder.

#### TextWithImage

- **File**: `apps/storefront/src/components/sections/text-with-image.tsx`
- **Type**: Server Component
- **Key data props**: `image`, `heading`, `headingTranslations`, `body`, `bodyTranslations`, `imagePosition` (left/right), `ctaText`, `ctaTranslations`, `ctaLink`
- **Description**: Simple two-column layout with heading, body text, optional arrow-linked CTA, and an image (4:3 aspect). Supports whitespace preservation in body text.

#### RichText

- **File**: `apps/storefront/src/components/sections/rich-text.tsx`
- **Type**: Server Component
- **Key data props**: `content` (ContentBlock[]), `contentTranslations` (Record<string, ContentBlock[]>)
- **ContentBlock types**: `heading` (with level), `paragraph`, `image` (with src, alt, caption)
- **Description**: Prose-styled rich text renderer supporting headings (h1-h6), paragraphs, and images with captions. Max-width 3xl, centered.

#### FaqAccordion

- **File**: `apps/storefront/src/components/sections/faq-accordion.tsx`
- **Type**: Client Component
- **Key data props**: `title`, `titleTranslations`, `items[]` (question, qTranslations, answer, aTranslations)
- **Description**: Accordion with bordered card style. One item open at a time. Chevron icon rotates on toggle. Animated slide-up on expand.

#### ImageGallery

- **File**: `apps/storefront/src/components/sections/image-gallery.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `images[]` (src, alt?, caption?), `columns` (2/3/4)
- **Description**: Responsive image grid with square aspect ratio, optional captions, and hover zoom effect (scale 1.05 on hover).

#### VideoEmbed

- **File**: `apps/storefront/src/components/sections/video-embed.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `url` (YouTube or Vimeo URL), `caption`, `captionTranslations`
- **Description**: Responsive 16:9 video embed. Automatically parses YouTube and Vimeo URLs into privacy-friendly embed URLs. Falls back to null if URL is unrecognized.

#### ProductGrid

- **File**: `apps/storefront/src/components/sections/product-grid.tsx`
- **Type**: Server Component (async, fetches products)
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `columns` (2-6), `limit`, `sortBy` (popular/newest), `categorySlug?`, `viewAllLink`, `showViewAll`
- **Description**: Responsive product grid with image, name, price, and "sold out" badge. Shows original price with strikethrough when discounted. Indicates "Multiple options" for variant products. Header with "Browse all" link. Mobile "view all" link at bottom.

#### ProductCarousel

- **File**: `apps/storefront/src/components/sections/product-carousel.tsx`
- **Type**: Server Component (async, fetches products)
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `limit`, `sortBy`, `categorySlug?`, `viewAllLink`
- **Description**: Horizontally scrollable product row. Fixed-width cards (w-56/w-64). Header with "See everything" link. Uses native overflow-x-auto scrolling with hidden scrollbar.

#### ProductListSimple

- **File**: `apps/storefront/src/components/sections/product-list-simple.tsx`
- **Type**: Server Component (async, fetches products)
- **Key data props**: `title`, `titleTranslations`, `limit`
- **Description**: Compact product list with small thumbnails (80x80) beside product name, category, and price. 3-column responsive grid. Based on Tailwind Plus "Simple list with small images" pattern.

#### CategoryGrid

- **File**: `apps/storefront/src/components/sections/category-grid.tsx`
- **Type**: Server Component (async, fetches categories)
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `columns` (3/6), `categoryIds?`
- **Description**: Category tiles with dark gradient backgrounds, decorative circles, accent overlay, and a floating initial letter. First tile is enlarged (col-span-2 row-span-2). Links to category pages. Gray-50 background.

#### CategoryBanner

- **File**: `apps/storefront/src/components/sections/category-banner.tsx`
- **Type**: Server Component (async, fetches categories)
- **Key data props**: `title`, `titleTranslations`, `categoryIds?`, `bannerImages` (Record<categoryId, imageUrl>)
- **Description**: Three large category banners in a row (lg:grid-cols-3). Each shows a full-bleed image (or gradient placeholder), category name, and "Shop the collection" link. Based on Tailwind Plus "3-column" category previews.

#### CollectionGrid

- **File**: `apps/storefront/src/components/sections/collection-grid.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `items[]` (title, titleTranslations, description, descriptionTranslations, image, href)
- **Description**: Three-column collection cards with tall images (3:2 or 5:6 on lg), title, and description below. Based on Tailwind Plus "3-column cards" category preview.

#### FeaturedSection

- **File**: `apps/storefront/src/components/sections/featured-section.tsx`
- **Type**: Server Component
- **Key data props**: `title`, `titleTranslations`, `subtitle`, `subtitleTranslations`, `ctaText`, `ctaTranslations`, `ctaLink`, `image`
- **Description**: Full-width featured banner with background image (or dark fallback), 75% opacity dark overlay, centered white text, and a white CTA button. Title supports line breaks via `\n` splitting. Based on Tailwind Plus "With image background" promo sections.

#### CategoryScroll

- **File**: `apps/storefront/src/components/sections/category-scroll.tsx`
- **Type**: Server Component (async, fetches categories)
- **Key data props**: `title`, `titleTranslations`, `showBrowseAll`
- **Description**: Horizontally scrollable category cards (h-80, w-56) with colorful gradient backgrounds (indigo, emerald, orange, sky, pink, amber). Shows up to 5 categories. Converts to 5-column grid on xl. Based on Tailwind Plus "With scrolling cards" pattern.

---

### 3.3 Product Components

#### ProductCard

- **File**: `apps/storefront/src/components/product/product-card.tsx`
- **Type**: Server Component
- **Props**: `product`, `locale`, `variant?`, `showCategory?`, `currency?`
- **Variants**: `simple` (default), `with-inline`, `with-cta`, `tall`, `wide`
  - `simple`: Image + name + price stacked
  - `with-inline`: Image + name left / price right
  - `with-cta`: Image + category + name + price + "Shop now" link
  - `tall`: 5:6 aspect ratio image + name + price
  - `wide`: Horizontal layout (image left, info right, 128x128 thumbnail)
- **Description**: Reusable product card with 5 display variants. Supports original price strikethrough, "Sold out" badge, category name display, and configurable currency.
- **Usage**:
```jsx
<ProductCard product={product} locale="en" variant="with-cta" showCategory />
```

#### ProductOverview

- **File**: `apps/storefront/src/components/product/product-overview.tsx`
- **Type**: Client Component
- **Props**: `product` (ProductDetail), `locale`, `currency?`
- **Description**: Full product detail page component. Includes breadcrumb navigation, image gallery with thumbnails (up to 4), discount percentage badge, category link, price with strikethrough, star rating placeholder (4/5), description, stock status indicator (green/red dot), quantity selector, "Add to cart" button, wishlist/share buttons, and trust badges (free shipping, secure payment, 7-day returns).
- **Usage**:
```jsx
<ProductOverview product={productDetail} locale="tc" currency="MOP" />
```

#### ProductQuickview

- **File**: `apps/storefront/src/components/product/product-quickview.tsx`
- **Type**: Client Component
- **Props**: `product`, `locale`, `open`, `onClose`, `currency?`
- **Description**: Modal overlay with two-column layout (image left, details right). Includes image with dot-style pagination, price, star rating, description (3-line clamp), stock status, "Add to cart" button, and "View full details" link. Renders null when `open` is false.

#### ProductReviews

- **File**: `apps/storefront/src/components/product/product-reviews.tsx`
- **Type**: Server Component
- **Props**: `reviews[]`, `averageRating`, `totalCount`, `ratingDistribution[]`, `locale`
- **Description**: Two-column reviews section with rating summary (large number + stars + distribution bars) on the left and review list on the right. Includes "Write a review" button. Reviews show avatar (or initial), name, star rating, date, and content. Empty state message when no reviews.

#### CategoryFilterSidebar

- **File**: `apps/storefront/src/components/product/category-filter-sidebar.tsx`
- **Type**: Client Component
- **Props**: `categories[]`, `selectedCategorySlug?`, `priceRanges?`, `selectedPriceRange?`, `sortOptions?`, `selectedSort?`, `locale`, `onCategoryChange?`, `onPriceChange?`, `onSortChange?`
- **Description**: Sidebar filter panel with sort-by options, collapsible category list (with item counts), and collapsible price range filters. Mobile-responsive with a slide-in drawer triggered by a filter button. Based on Tailwind Plus "With inline actions and expandable sidebar filters" pattern.

---

### 3.4 Cart Components

#### CartDrawer

- **File**: `apps/storefront/src/components/cart/cart-drawer.tsx`
- **Type**: Client Component
- **Props**: `open`, `onClose`, `items[]`, `locale`, `currency?`, `onUpdateQuantity?`, `onRemove?`
- **Description**: Slide-in drawer from right side with backdrop overlay. Shows cart items using `CartItemRow`, subtotal, shipping note, checkout link, and "Continue Shopping" button. Empty state with shopping bag icon and message.

#### CartItemRow

- **File**: `apps/storefront/src/components/cart/cart-item-row.tsx`
- **Type**: Client Component
- **Props**: `item` (CartItemData), `locale`, `currency?`, `onUpdateQuantity?`, `onRemove?`
- **Description**: Single cart line item with 96x96 thumbnail, name, variant label, line total, quantity dropdown (1-10), and "Remove" link.

#### CartPageView

- **File**: `apps/storefront/src/components/cart/cart-page-view.tsx`
- **Type**: Client Component
- **Props**: `items[]`, `locale`, `currency?`, `onUpdateQuantity?`, `onRemove?`
- **Description**: Full-page cart view with two-column layout (items left, order summary right). Order summary shows subtotal, shipping estimate, and total. Checkout CTA and "Continue Shopping" link. Empty state with cart icon. Based on Tailwind Plus "With extended summary" shopping cart.

---

### 3.5 Checkout Components

#### CheckoutForm

- **File**: `apps/storefront/src/components/checkout/checkout-form.tsx`
- **Type**: Client Component
- **Props**: `locale`, `currency?`, `deliveryZones?`, `subtotal`
- **Description**: Two-column checkout layout with form on left and order summary on right. Sections: contact info (email/phone), delivery method (delivery vs pickup radio cards), delivery zone selector with fee display, shipping address fields (name, phone, address, district, postal code), and payment method (MPay, Alipay, WeChat Pay, Cash on delivery). Supports free shipping threshold per zone.

#### OrderConfirmation

- **File**: `apps/storefront/src/components/checkout/order-confirmation.tsx`
- **Type**: Server Component
- **Props**: `receiptNo`, `items[]`, `subtotal`, `deliveryFee`, `total`, `deliveryMethod`, `estimatedDelivery?`, `locale`, `currency?`
- **Description**: Success page with green checkmark icon, order number, item list with thumbnails, cost breakdown (subtotal, shipping, total), estimated delivery info, and action buttons (view orders / continue shopping).

---

### 3.6 Account Components

#### LoginForm

- **File**: `apps/storefront/src/components/account/login-form.tsx`
- **Type**: Client Component
- **Props**: `locale`, `tenantName`, `accentColor?`
- **Description**: Two-step passwordless login flow. Step 1: phone/email toggle with input field and "Send verification code" button. Step 2: 6-digit code input with auto-focus advance, verify button, and resend link. Logo uses tenant initial with accent color. Includes register link at bottom.

#### OrderHistoryList

- **File**: `apps/storefront/src/components/account/order-history-list.tsx`
- **Type**: Server Component
- **Props**: `orders[]` (OrderSummary), `locale`, `currency?`
- **Description**: Order history cards with header (order number, date, status badge, total, item count), item thumbnail strip (overlapping circles, up to 5 + overflow count), and "View order" link. Status badges color-coded: green (completed/delivered), blue (shipped/preparing), red (cancelled), yellow (pending). Supports 7 order statuses. Empty state with package icon.

---

## 4. Section System

### SectionRenderer

**File**: `apps/storefront/src/components/sections/section-renderer.tsx`

The `SectionRenderer` is the core orchestrator for the homepage. It receives a `SectionConfig[]` from the database (via `storefront_configs.homepageSections`), filters to enabled sections, and renders each by looking up the component in `SECTION_MAP`.

### SectionConfig Type

```typescript
type SectionConfig = {
  id: string;        // Unique identifier (e.g., "hero-default")
  type: string;      // Maps to SECTION_MAP key (e.g., "hero_banner")
  enabled: boolean;  // Toggle visibility without removing
  data: Record<string, unknown>;  // Section-specific data
};
```

### Registered Section Types (21 total)

| `type` key | Component | Category |
|---|---|---|
| `hero_banner` | HeroBanner | Promo |
| `promo_banner` | PromoBanner | Promo |
| `sale_banner` | SaleBanner | Promo |
| `split_promo` | SplitPromo | Promo |
| `featured_section` | FeaturedSection | Promo |
| `product_grid` | ProductGrid | Product Lists |
| `product_carousel` | ProductCarousel | Product Lists |
| `product_list_simple` | ProductListSimple | Product Lists |
| `category_grid` | CategoryGrid | Category Previews |
| `category_banner` | CategoryBanner | Category Previews |
| `category_scroll` | CategoryScroll | Category Previews |
| `collection_grid` | CollectionGrid | Category Previews |
| `feature_grid` | FeatureGrid | Product Features |
| `feature_split` | FeatureSplit | Product Features |
| `testimonials` | Testimonials | Reviews |
| `incentive_grid` | IncentiveGrid | Incentives |
| `newsletter` | Newsletter | Engagement |
| `text_with_image` | TextWithImage | Content |
| `rich_text` | RichText | Content |
| `faq_accordion` | FaqAccordion | Content |
| `image_gallery` | ImageGallery | Content |
| `video_embed` | VideoEmbed | Content |

### Default Homepage Configuration

When no merchant-configured sections exist, the homepage renders 7 default sections:

1. `hero_banner` -- Full-width dark hero with Tailwind Plus sample image
2. `category_scroll` -- Horizontal scrollable category cards
3. `featured_section` -- "Level up your desk" style featured banner
4. `product_grid` -- 4-column grid, 8 products, sorted by popular
5. `collection_grid` -- 3 collection cards (Daily Essentials, Snack Corner, New Picks)
6. `featured_section` -- "Simple productivity" style featured banner
7. `incentive_grid` -- 4 trust badges (delivery, payment, returns, shipping)

All default content is translated into tc, sc, en, pt, ja.

---

## 5. Tailwind Plus Coverage

| TW+ Category | TW+ Count | Built | Covered Variants | Status |
|---|---|---|---|---|
| **Product Overviews** | 5 | 1 | Split with image gallery, breadcrumb, qty selector, trust badges | Partial |
| **Product Lists** | 11 | 5 | Simple grid, inline price, with CTA, tall cards, wide/horizontal, carousel, compact list | Good |
| **Category Previews** | 6 | 4 | Grid with gradient tiles, 3-column banner, 3-column collection cards, horizontal scroll | Good |
| **Shopping Carts** | 6 | 2 | Slide-over drawer, full page with extended summary | Partial |
| **Category Filters** | 5 | 1 | Sidebar with expandable sections + mobile drawer | Partial |
| **Product Quickviews** | 4 | 1 | Modal with image + details split | Partial |
| **Product Features** | 9 | 2 | Icon grid (2/3/4 col), split with image + definition list | Partial |
| **Store Navigation** | 5 | 1 | Dark nav with top bar, flyout category links, mobile menu | Partial |
| **Promo Sections** | 8 | 5 | Full-width hero, announcement bar, sale countdown, split promo, featured banner | Good |
| **Checkout Forms** | 5 | 1 | Multi-step with delivery/payment, address form, order summary sidebar | Partial |
| **Reviews** | 4 | 1 | With rating summary, distribution bars, review list | Partial |
| **Order Summaries** | 4 | 1 | Confirmation page with item list, cost breakdown, action buttons | Partial |
| **Order History** | 4 | 1 | Card list with status badges, item thumbnails, date formatting | Partial |
| **Incentives** | 8 | 1 | 4-column icon strip with border | Partial |

**Overall**: 22 unique Tailwind Plus variants implemented out of ~84 total across all categories.

---

## 6. Missing Variants / TODO

### Product Cards
- Product card with color swatch selectors
- Product card with image overlay + quick-add button
- Product card with border grid layout (no rounded corners)
- Product card with full inline details (rating stars, description, reviews count)

### Product Overviews
- With tiered images (staggered gallery)
- With image grid (2x2)
- With tabs (description, specs, reviews as tabs)
- With split gallery and colored variants

### Shopping Carts
- Cart with two-column summary
- Cart with popover (non-drawer)
- Cart with order notes / gift message
- Cart modal overlay variant

### Category Filters
- With dropdown menus (non-sidebar)
- With horizontal filter chips
- With centered text-only layout
- With checkbox-based multi-select

### Product Quickviews
- With color selector
- With size selector
- With large image variant

### Product Features
- With tiered images
- With 2x2 grid layout
- With tabs
- With fading images on scroll
- With header, description, and image
- With square images grid
- With wide images

### Store Navigation
- Mega menu with featured items
- With centered logo
- With promotional banner below nav
- Double-row navigation

### Checkout Forms
- Single-page checkout (no accordion)
- Split page with mobile summary
- With coupon code input
- With saved addresses

### Reviews
- Multi-column layout
- With image attachments
- With filtering (by star)

### Order Summaries
- With progress tracker
- Split screen variant
- With invoice download

### Order History
- With reorder button
- With tracking timeline
- With invoice links

### Incentives
- 2-column with descriptions
- 3-column with illustrations
- With header and icons
- Split with image
- With background variants
- Centered icons with description
- Dark/colored background variants

### General
- Dark mode variants for all section components
- RTL (right-to-left) layout support

---

## 7. Next Steps

### Page Routes Needed

| Route | Purpose | Components Used |
|---|---|---|
| `/[locale]` | Homepage | `SectionRenderer` + all section components (done) |
| `/[locale]/products` | Product listing with filters | `ProductCard`, `CategoryFilterSidebar` |
| `/[locale]/products/[slug]` | Product detail page | `ProductOverview`, `ProductReviews`, `ProductQuickview` |
| `/[locale]/categories/[slug]` | Category page (filtered products) | `ProductCard`, `CategoryFilterSidebar` |
| `/[locale]/cart` | Cart page | `CartPageView` |
| `/[locale]/checkout` | Checkout flow | `CheckoutForm` |
| `/[locale]/checkout/confirmation` | Order confirmation | `OrderConfirmation` |
| `/[locale]/login` | Customer login | `LoginForm` |
| `/[locale]/register` | Customer registration | (needs new component) |
| `/[locale]/account` | Account dashboard | (needs new component) |
| `/[locale]/account/orders` | Order history | `OrderHistoryList` |
| `/[locale]/account/orders/[id]` | Order detail | (needs new component) |
| `/[locale]/pages/[slug]` | Static pages (about, terms, privacy, etc.) | `RichText` |

### Server Actions Needed

| Action | Purpose |
|---|---|
| `addToCart` | Add product to cart (create cart if needed) |
| `updateCartItem` | Change quantity of cart item |
| `removeCartItem` | Remove item from cart |
| `getCart` | Fetch current cart contents |
| `createOrder` | Convert cart to order with delivery/payment info |
| `sendVerificationCode` | OTP login step 1 |
| `verifyCode` | OTP login step 2 |
| `getCustomerOrders` | Fetch order history for logged-in customer |
| `subscribeNewsletter` | Newsletter email signup |

### Database / Seed Data Needed

| Data | Status |
|---|---|
| Product slugs for URL routing | Missing -- products need `slug` column populated |
| Category slugs for URL routing | Missing -- categories need `slug` column populated |
| Storefront config record | Schema exists (`storefront_configs` table) |
| Delivery zones | Schema exists (`delivery_zones` table) |
| Customer sessions / auth | Schema exists (`customer_sessions`, `verification_codes` tables) |
| Cart / cart items | Schema exists (`carts`, `cart_items` tables) |
| Sample homepage sections JSON | Available as default in `page.tsx` |

### Integration Points

1. **Cart state**: Currently components accept cart data as props. Need a cart context/provider or server-side cookie-based cart.
2. **Auth flow**: `LoginForm` UI is complete but submit handlers are placeholders. Need to wire to `verification_codes` table and `customer_sessions`.
3. **Payment**: `CheckoutForm` shows MPay/Alipay/WeChat Pay/COD options. Payment gateway integration is not yet implemented.
4. **Image hosting**: Product images are referenced by URL. Need to decide on image storage (local uploads vs CDN).
5. **Search**: Header has search link but no search page or functionality. Consider full-text search or Algolia integration.
