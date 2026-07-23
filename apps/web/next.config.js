/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['@scout/shared'],
};

module.exports = nextConfig;
