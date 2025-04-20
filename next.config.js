/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/videos/:path*',
        destination: '/output/videos/:path*',
      },
    ];
  },
}

module.exports = nextConfig 