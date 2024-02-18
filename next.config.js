/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  // experimental: {
  //   forceSwcTransforms: true,
  // },
  env: {
    EMAIL_PORT: process.env.EMAIL_PORT,
    FILE_FOR_SERVER: process.env.FILE_FOR_SERVER,
    HOOKDECK_SOURCE: process.env.HOOKDECK_SOURCE,
    M_NAME: process.env.M_NAME,
    M_VENDOR: process.env.M_VENDOR,
    OMNI_AIRPORT_GMAIL_PASS: process.env.OMNI_AIRPORT_GMAIL_PASS,
    OMNI_AIRPORT_GMAIL_USER: process.env.OMNI_AIRPORT_GMAIL_USER,
    REDIS_URL: process.env.REDIS_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SERVER_IP_ADDRESS: process.env.SERVER_IP_ADDRESS,
    SERVER_PASSWORD: process.env.SERVER_PASSWORD,
    SERVER_USER: process.env.SERVER_USER,
    SHOPIFY_HOST: process.env.SHOPIFY_HOST,
    SHOPIFY_SECRET: process.env.SHOPIFY_SECRET,
    SHOPIFY_TOPIC: process.env.SHOPIFY_TOPIC,
    SHOPIFY_WEBHOOK_ID: process.env.SHOPIFY_WEBHOOK_ID,
    SMTP_HOST: process.env.SMTP_HOST,
    THIRD_PARTY_TOPIC: process.env.THIRD_PARTY_TOPIC,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    WEBHOOK_NAME: process.env.WEBHOOK_NAME,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TWILIO_MESSAGING_SID: process.env.TWILIO_MESSAGING_SID,
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // config.resolve.fallback = { tls: false };
    // Important: return the modified config
    // config.infrastructureLogging = { debug: /PackFileCache/ };
    return config;
  },
};

module.exports = nextConfig;
