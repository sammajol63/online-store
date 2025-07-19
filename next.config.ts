import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "static.nike.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.ncrsport.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.kidzstation.co.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.backcountry.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kidzstation.co.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.ncrsport.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
