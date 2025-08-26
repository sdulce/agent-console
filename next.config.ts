// next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

// Wrap your config with next-pwa
const withPWAWrapped = withPWA({
  dest: "public",     // where the service worker & precache manifest go
  disable: !isProd,   // enable SW only in production
  register: true,     // auto-register service worker
  skipWaiting: true,  // activate new SW immediately
  // runtimeCaching: [...] // (optional) add custom caching later
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }, // optional; safe default for PWA caching
};

export default withPWAWrapped(nextConfig);
