import type { NextConfig } from "next";

// Redirect root to /zip-guides only on the guides Vercel project
const isGuidesProject =
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '').includes('purchase-request') ||
  (process.env.VERCEL_URL ?? '').includes('purchase-request')

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  ...(isGuidesProject && {
    async redirects() {
      return [{ source: '/', destination: '/zip-guides', permanent: false }]
    },
  }),
};

export default nextConfig;
