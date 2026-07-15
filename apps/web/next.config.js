/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Next.js server talks to NestJS using this internal URL —
  // it never goes through the public internet, just Docker's private network
  env: {
    API_INTERNAL_URL: process.env.API_INTERNAL_URL ?? 'http://localhost:3001',
  },

  // Rewrites aren't used — we go through Server Actions instead of the browser calling NestJS directly
  // But keeping this here as a reminder of the BFF pattern
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

};

module.exports = nextConfig;
