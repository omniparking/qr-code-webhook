/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

// import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  env: {
    AMAZ_ACCESS_KEY_ID: process.env.AMAZ_ACCESS_KEY_ID,
    AMAZ_BUCKET_NAME: process.env.AMAZ_BUCKET_NAME,
    AMAZ_SECRET_ACCESS_KEY: process.env.AMAZ_SECRET_ACCESS_KEY,
    EMAIL_PORT: process.env.EMAIL_PORT,
    FILE_FOR_SERVER: process.env.FILE_FOR_SERVER,
    GO_DADDY_PASS: process.env.GO_DADDY_PASS,
    GO_DADDY_USER: process.env.GO_DADDY_USER,
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
  }
};

// module.exports = {
//   serverRuntimeConfig: {
//     PROJECT_ROOT: path.join(`${__dirname}/../`)
//   }
// };

module.exports = nextConfig;
