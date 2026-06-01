/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The typed contract client is a workspace TS package consumed from source,
  // so Next must transpile it (no separate build step needed on Vercel).
  transpilePackages: ['@questboard/quest-client'],
};

export default nextConfig;
