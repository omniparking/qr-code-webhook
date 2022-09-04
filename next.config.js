/** @type {import('next').NextConfig} */
/*jshint esversion: 8 */

// import path from 'path';

const nextConfig = {
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  }
};

// module.exports = {
//   serverRuntimeConfig: {
//     PROJECT_ROOT: path.join(`${__dirname}/../`)
//   }
// };

module.exports = nextConfig;
