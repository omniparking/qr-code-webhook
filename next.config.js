/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  env: {
    EMAIL_PORT: process.env.EMAIL_PORT,
    FILE_FOR_SERVER: process.env.FILE_FOR_SERVER,
    OMNI_AIRPORT_GMAIL_PASS: process.env.OMNI_AIRPORT_GMAIL_PASS,
    OMNI_AIRPORT_GMAIL_USER: process.env.OMNI_AIRPORT_GMAIL_USER,
    REDIS_URL: process.env.REDIS_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SERVER_IP_ADDRESS: process.env.SERVER_IP_ADDRESS,
    SERVER_PASSWORD: process.env.SERVER_PASSWORD,
    SERVER_USER: process.env.SERVER_USER,
    SHOPIFY_SECRET: process.env.SHOPIFY_SECRET,
    SHOPIFY_WEBHOOK_ID: process.env.SHOPIFY_WEBHOOK_ID,
    SMTP_HOST: process.env.SMTP_HOST,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    SHOPIFY_TOPIC: process.env.SHOPIFY_TOPIC,
    SHOPIFY_HOST: process.env.SHOPIFY_HOST,
  },
};

module.exports = nextConfig;
