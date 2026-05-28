/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The shared types package is consumed as source; transpile it so Next picks it up.
  transpilePackages: ['@droxyde/types'],
  typedRoutes: true,
};

export default nextConfig;
