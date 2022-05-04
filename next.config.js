/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  }
  /* serverRuntimeConfig: { // this is to make __dirname project_root to make files accessible server side
    PROJECT_ROOT: __dirname
  } */
};

module.exports = nextConfig;
