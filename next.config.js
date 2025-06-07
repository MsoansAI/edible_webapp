/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['rescloud.ediblearrangements.com', 'example.com'],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 