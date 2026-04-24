import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clerkMockMode = process.env.NEXT_PUBLIC_CLERK_MOCK_MODE === 'true';

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
  webpack: (config, { webpack }) => {
    if (clerkMockMode) {
      const stubClient = path.resolve(__dirname, 'lib/clerk-stub.tsx');
      const stubServer = path.resolve(__dirname, 'lib/clerk-stub-server.tsx');
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /@clerk\/nextjs$/,
          stubClient,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@clerk\/nextjs\/server$/,
          stubServer,
        ),
      );
      config.resolve ||= {};
      config.resolve.alias ||= {};
      Object.assign(config.resolve.alias, {
        '@clerk/nextjs': stubClient,
        '@clerk/nextjs/server': stubServer,
      });
    }
    return config;
  },
};

export default nextConfig;
