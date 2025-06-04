/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rescloud.ediblearrangements.com',
        pathname: '/image/private/**',
      },
    ],
  },
}

module.exports = nextConfig