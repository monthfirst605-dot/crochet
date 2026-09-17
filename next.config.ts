import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Blob storage + any https image URL you paste into the admin panel.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Ship less JS on first load for the storefront.
    optimizePackageImports: ["@neondatabase/serverless"],
  },
};

export default config;
