import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['ipfs.erebrus.io', 'ipfs.io'], // Add your allowed domains here
    unoptimized: true,
  }, 
};

export default nextConfig;