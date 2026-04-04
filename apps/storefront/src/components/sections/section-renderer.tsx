import type { Locale } from "@macau-pos/i18n";
import HeroBanner from "./hero-banner";
import ProductGrid from "./product-grid";
import ProductCarousel from "./product-carousel";
import ProductListSimple from "./product-list-simple";
import CategoryGrid from "./category-grid";
import CategoryBanner from "./category-banner";
import PromoBanner from "./promo-banner";
import SaleBanner from "./sale-banner";
import SplitPromo from "./split-promo";
import FeatureGrid from "./feature-grid";
import FeatureSplit from "./feature-split";
import Testimonials from "./testimonials";
import IncentiveGrid from "./incentive-grid";
import Newsletter from "./newsletter";
import TextWithImage from "./text-with-image";
import RichText from "./rich-text";
import FaqAccordion from "./faq-accordion";
import ImageGallery from "./image-gallery";
import VideoEmbed from "./video-embed";

export type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type Props = {
  sections: SectionConfig[];
  locale: string;
  tenantId: string;
};

const SECTION_MAP: Record<string, React.ComponentType<{ data: Record<string, unknown>; locale: string; tenantId: string }>> = {
  hero_banner: HeroBanner,
  product_grid: ProductGrid,
  product_carousel: ProductCarousel,
  product_list_simple: ProductListSimple,
  category_grid: CategoryGrid,
  category_banner: CategoryBanner,
  promo_banner: PromoBanner,
  sale_banner: SaleBanner,
  split_promo: SplitPromo,
  feature_grid: FeatureGrid,
  feature_split: FeatureSplit,
  testimonials: Testimonials,
  incentive_grid: IncentiveGrid,
  newsletter: Newsletter,
  text_with_image: TextWithImage,
  rich_text: RichText,
  faq_accordion: FaqAccordion,
  image_gallery: ImageGallery,
  video_embed: VideoEmbed,
};

export default function SectionRenderer({ sections, locale, tenantId }: Props) {
  return (
    <div className="space-y-0">
      {sections
        .filter((s) => s.enabled)
        .map((section) => {
          const Component = SECTION_MAP[section.type];
          if (!Component) return null;
          return (
            <section key={section.id} className="animate-fade-in">
              <Component data={section.data} locale={locale} tenantId={tenantId} />
            </section>
          );
        })}
    </div>
  );
}
