/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  pageExtensions: ["ts", "tsx", "d.ts"],
  // experimental: {
  //   forceSwcTransforms: true,
  // },
  env: {
    HOOKDECK_SOURCE: process.env.HOOKDECK_SOURCE,
    M_NAME: process.env.M_NAME,
    M_VENDOR: process.env.M_VENDOR,
    SHOPIFY_TOPIC: process.env.SHOPIFY_TOPIC,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  ) => {
    // config.resolve.fallback = { tls: false };
    // Important: return the modified config
    // config.infrastructureLogging = { debug: /PackFileCache/ };
    return config;
  },
};

module.exports = nextConfig;
