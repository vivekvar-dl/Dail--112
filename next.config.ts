import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sharp'],
  // Configure images for Google Maps
  images: {
    domains: ['maps.googleapis.com', 'maps.gstatic.com'],
  },
};

export default nextConfig;
