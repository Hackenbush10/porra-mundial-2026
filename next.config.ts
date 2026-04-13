import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly opt in to Turbopack (Next.js 16 default).
  // @react-pdf/renderer v3+ does not require canvas, so no alias is needed.
  turbopack: {},
};

export default nextConfig;
