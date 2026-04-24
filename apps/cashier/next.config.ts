import type { NextConfig } from "next";

// Short git SHA injected by docker-compose at build time as a build-arg
// (see docker-compose.production.yml). Surfaced in the lock screen so
// we can visually confirm which build is running on a given device.
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@macau-pos/database", "@macau-pos/escpos-shared"],
  serverExternalPackages: ["pg"],
  allowedDevOrigins: ["127.0.0.1", "10.10.14.81", "localhost"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.BUILD_ID || "dev",
  },
};

export default nextConfig;
