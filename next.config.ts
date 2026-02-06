import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {},

  // Webpack configuration for web3 libraries
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
