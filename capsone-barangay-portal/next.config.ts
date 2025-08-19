import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  eslint:{
    // Disable the no-undef rule globally
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
