import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@macau-pos/database"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
