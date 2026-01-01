import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */ 
  // disable lint and type checking during builds
 
  typescript: {
    ignoreBuildErrors: true,
  },
  
};

export default nextConfig;
