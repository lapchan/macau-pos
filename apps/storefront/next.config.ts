import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@macau-pos/database", "@macau-pos/i18n"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
