import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@macau-pos/database", "@macau-pos/i18n"],
  serverExternalPackages: ["pg"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "tailwindcss.com" },
      { protocol: "https", hostname: "img.shoplineapp.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "feature.com" },
      { protocol: "https", hostname: "www.bbcicecream.com" },
      { protocol: "https", hostname: "edge.dis.commercecloud.salesforce.com" },
      { protocol: "https", hostname: "www.humanmade.jp" },
    ],
  },
};

export default nextConfig;
