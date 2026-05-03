import type { NextConfig } from "next";

// Short git SHA injected by docker-compose at build time as a build-arg
// (see docker-compose.production.yml). Surfaced in the lock screen so
// we can visually confirm which build is running on a given device.
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@macau-pos/database", "@macau-pos/escpos-shared"],
  serverExternalPackages: ["pg"],
  allowedDevOrigins: ["127.0.0.1", "10.10.14.81", "10.10.14.138", "localhost"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.BUILD_ID || "dev",
  },
  // Serve the .mobileconfig with the right MIME so iOS Safari recognizes
  // it as an installable configuration profile (instead of downloading
  // it as a generic file).
  async headers() {
    return [
      {
        source: "/:file*\\.mobileconfig",
        headers: [
          { key: "Content-Type", value: "application/x-apple-aspen-config; charset=utf-8" },
          { key: "Content-Disposition", value: "inline" },
        ],
      },
    ];
  },
};

export default nextConfig;
