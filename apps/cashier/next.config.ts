import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@macau-pos/database"],
  serverExternalPackages: ["pg"],
  allowedDevOrigins: ["127.0.0.1"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
