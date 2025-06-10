/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['rescloud.ediblearrangements.com', 'example.com'],
    unoptimized: true
  },
  
  // Development features
  reactStrictMode: true,
  swcMinify: true,
  
  // Debugging and development
  productionBrowserSourceMaps: true,
  
  // Build optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Development indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // Temporary build settings (remove in production)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Experimental features for better development experience
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Webpack configuration for better debugging
  webpack: (config, { dev, isServer }) => {
    // Better debugging in development
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    
    // Optimize for development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Bundle commonly used libraries separately
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Bundle common utilities
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Headers for better development experience
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 