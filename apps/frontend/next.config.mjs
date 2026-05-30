import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Trace deps from the monorepo root (required for pnpm workspaces on Vercel).
  outputFileTracingRoot: monorepoRoot,
  // The shared types package is consumed as source; transpile it so Next picks it up.
  transpilePackages: ['@droxyde/types'],
  typedRoutes: true,
};

export default nextConfig;
