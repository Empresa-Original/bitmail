/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@bitmail/core', '@bitmail/ui', '@bitmail/adapters-nostr'],
  webpack: (config) => {
    config.externalsPresets = { node: true };
    return config;
  },
};

export default nextConfig;
