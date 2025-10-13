import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignoriši greške tokom build-a
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
