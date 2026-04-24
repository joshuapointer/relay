/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@relay/ui-core',
    '@relay/design-tokens',
    '@relay/shared-types',
    '@relay/sdk',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.relay.app',
      },
    ],
  },
};

export default nextConfig;
