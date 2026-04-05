"use client";

import { XIcon } from "lucide-react";

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type SectionTypeMeta = {
  label: string;
  icon: string;
  description: string;
  category: string;
};

export const SECTION_TYPE_META: Record<string, SectionTypeMeta> = {
  hero_banner: { label: "Hero Banner", icon: "🖼️", description: "Full-width hero with image, title, and CTA", category: "Hero & Banners" },
  featured_section: { label: "Featured Section", icon: "⭐", description: "Featured content with image overlay and CTA", category: "Hero & Banners" },
  promo_banner: { label: "Promo Banner", icon: "📢", description: "Promotional announcement banner", category: "Hero & Banners" },
  sale_banner: { label: "Sale Banner", icon: "🏷️", description: "Sale countdown or announcement", category: "Hero & Banners" },
  split_promo: { label: "Split Promo", icon: "📐", description: "Two-column promotional layout", category: "Hero & Banners" },

  product_grid: { label: "Product Grid", icon: "🛍️", description: "Grid of products with configurable columns", category: "Products" },
  product_carousel: { label: "Product Carousel", icon: "🎠", description: "Horizontal scrolling product row", category: "Products" },
  product_list_simple: { label: "Product List", icon: "📋", description: "Simple product list layout", category: "Products" },

  category_grid: { label: "Category Grid", icon: "📂", description: "Grid of category tiles", category: "Categories" },
  category_scroll: { label: "Category Scroll", icon: "🔄", description: "Horizontal scrolling category cards", category: "Categories" },
  category_banner: { label: "Category Banner", icon: "🏞️", description: "Category-focused banner section", category: "Categories" },
  collection_grid: { label: "Collection Grid", icon: "🎨", description: "Curated collection cards (3 items)", category: "Categories" },

  feature_grid: { label: "Feature Grid", icon: "✨", description: "Grid of feature/benefit cards", category: "Features" },
  feature_split: { label: "Feature Split", icon: "↔️", description: "Split layout with feature content", category: "Features" },
  incentive_grid: { label: "Incentive Grid", icon: "🛡️", description: "Trust signals (delivery, security, returns)", category: "Features" },
  testimonials: { label: "Testimonials", icon: "💬", description: "Customer testimonial quotes", category: "Features" },

  newsletter: { label: "Newsletter", icon: "📧", description: "Email subscription form", category: "Content" },
  text_with_image: { label: "Text + Image", icon: "📝", description: "Text content with side image", category: "Content" },
  rich_text: { label: "Rich Text", icon: "📄", description: "Heading and paragraph blocks", category: "Content" },
  faq_accordion: { label: "FAQ Accordion", icon: "❓", description: "Expandable Q&A section", category: "Content" },
  image_gallery: { label: "Image Gallery", icon: "🖼", description: "Image grid or gallery", category: "Media" },
  video_embed: { label: "Video Embed", icon: "🎬", description: "Embedded video player", category: "Media" },
};

const CATEGORIES = ["Hero & Banners", "Products", "Categories", "Features", "Content", "Media"];

// Default data for each section type
function getDefaultData(type: string): Record<string, unknown> {
  switch (type) {
    case "hero_banner": return { title: "Welcome", subtitle: "Discover our products", ctaText: "Shop Now", ctaLink: "/tc/products", height: "lg" };
    case "featured_section": return { title: "Featured", subtitle: "Check out our latest", ctaText: "Shop Now", ctaLink: "/tc/products" };
    case "promo_banner": return { title: "Special Offer", subtitle: "Limited time only" };
    case "sale_banner": return { title: "Sale", ctaText: "Shop Sale" };
    case "split_promo": return { title: "New Collection", subtitle: "Explore now" };
    case "product_grid": return { title: "Featured Products", limit: 8, columns: 4, sortBy: "popular", showViewAll: true };
    case "product_carousel": return { title: "New Arrivals", limit: 10, sortBy: "newest" };
    case "product_list_simple": return { title: "Products", limit: 6 };
    case "category_grid": return { title: "Shop by Category", columns: 3 };
    case "category_scroll": return { title: "Browse Categories", showBrowseAll: true };
    case "category_banner": return { title: "Category" };
    case "collection_grid": return { title: "Collections", items: [] };
    case "feature_grid": return { title: "Why Choose Us", items: [] };
    case "feature_split": return { title: "Feature", description: "Description" };
    case "incentive_grid": return { items: [
      { icon: "truck", title: "Free Delivery", description: "On orders over MOP 200" },
      { icon: "shield", title: "Secure Payment", description: "MPay · Alipay · WeChat" },
      { icon: "refresh", title: "Easy Returns", description: "7-day return policy" },
      { icon: "clock", title: "Fast Shipping", description: "Same-day processing" },
    ]};
    case "testimonials": return { title: "What Customers Say", items: [] };
    case "newsletter": return { title: "Subscribe", subtitle: "Get the latest deals" };
    case "text_with_image": return { title: "About Us", text: "Our story..." };
    case "rich_text": return { content: [{ type: "heading", level: 2, text: "Heading" }, { type: "paragraph", text: "Content here..." }] };
    case "faq_accordion": return { title: "FAQ", items: [{ q: "Question?", a: "Answer." }] };
    case "image_gallery": return { title: "Gallery", images: [] };
    case "video_embed": return { title: "Video", videoUrl: "" };
    default: return {};
  }
}

type Props = {
  onAdd: (section: SectionConfig) => void;
  onClose: () => void;
};

export default function SectionPalette({ onAdd, onClose }: Props) {
  const handleAdd = (type: string) => {
    onAdd({
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      data: getDefaultData(type),
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] bottom-[10%] mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <XIcon size={20} />
          </button>
        </div>

        {/* Section types grouped by category */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(80vh - 80px)" }}>
          {CATEGORIES.map((category) => {
            const types = Object.entries(SECTION_TYPE_META).filter(([, m]) => m.category === category);
            if (types.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{category}</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {types.map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => handleAdd(type)}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <span className="mt-0.5 text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-500">{meta.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
