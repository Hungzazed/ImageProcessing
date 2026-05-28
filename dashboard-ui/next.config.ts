import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: 'http://localhost:3000/auth/login',
        permanent: false,
      },
      {
        source: '/login',
        destination: 'http://localhost:3000/auth/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
