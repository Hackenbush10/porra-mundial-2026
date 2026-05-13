import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly opt in to Turbopack (Next.js 16 default).
  // @react-pdf/renderer v3+ does not require canvas, so no alias is needed.
  turbopack: {},

  async redirects() {
    return [
      {
        source: '/v2',
        destination: '/',
        permanent: true, // 308 — cacheable by browsers and CDNs
      },
    ];
  },
};

export default nextConfig;
