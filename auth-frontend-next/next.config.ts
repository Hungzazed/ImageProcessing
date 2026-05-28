import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
