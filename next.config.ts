import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow Docker builds to proceed even if lint issues exist
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if type errors are present
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

