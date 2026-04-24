// Build: 2026-04-12
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shared/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CountingStars POS",
  icons: {
    icon: "/api/favicon?name=CountingStars&color=%234f6ef7",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CountingStars POS",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f6ef7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.variable}>
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

function ServiceWorkerRegistration() {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async function() {
              // Dev mode: unregister any prior SW and purge all caches so
              // server-action hash mismatches ("module factory not available")
              // from stale chunk caching never happen during local iteration.
              // Production keeps the offline-capable SW.
              if (${isDev}) {
                try {
                  var regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(function(r) { return r.unregister(); }));
                  if (window.caches) {
                    var keys = await caches.keys();
                    await Promise.all(keys.map(function(k) { return caches.delete(k); }));
                  }
                } catch (err) { /* ignore */ }
                return;
              }
              navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function() {
                var chunks = [];
                document.querySelectorAll('script[src*="/_next/static/"]').forEach(function(s) { chunks.push(s.src); });
                document.querySelectorAll('link[href*="/_next/static/"]').forEach(function(l) { chunks.push(l.href); });
                if (navigator.serviceWorker.controller && chunks.length > 0) {
                  navigator.serviceWorker.controller.postMessage({ type: 'PRECACHE_CHUNKS', urls: chunks });
                }
              }).catch(function() {});
            });
          }
        `,
      }}
    />
  );
}
