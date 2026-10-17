import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  output: process.env.GITHUB_PAGES === 'true' ? 'export' : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
