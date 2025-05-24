import type { NextConfig } from "next"

if (!process.env.API_SERVER_BASEURL) {
  throw new Error(
    "API_SERVER_BASEURL is not defined in the environment variables. Please set it in your .env file."
  )
}

if (!process.env.IMAGE_HOST) {
  throw new Error(
    "IMAGE_HOST is not defined in the environment variables. Please set it in your .env file."
  )
}

const nextConfig: NextConfig = {
  async rewrites() {
    const apiServerBaseUrl = process.env.API_SERVER_BASEURL
    return [
      {
        source: "/api/bots/:path*",
        destination: `${apiServerBaseUrl}/bots/:path*`
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        hostname: process.env.IMAGE_HOST,
        protocol: "https"
      }
    ]
  }
}

export default nextConfig
