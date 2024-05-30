// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  basePath: process.env.NODE_ENV === "production" ? "/nft-marketplace" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/nft-marketplace" : "",
};
