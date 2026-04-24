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
  webpack: (config) => {
    if (clerkMockMode) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        '@clerk/nextjs$': path.resolve(__dirname, 'lib/clerk-stub.tsx'),
        '@clerk/nextjs/server$': path.resolve(
          __dirname,
          'lib/clerk-stub-server.tsx',
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
