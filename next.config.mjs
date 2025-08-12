// next.config.mjs - using ES module syntax
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add transpilation for the force-graph package
  transpilePackages: ['react-force-graph', 'd3-force', 'd3-quadtree', 'd3-color'],
  
  // Configure webpack to handle specific dependencies
  webpack: (config) => {
    // Handle specific dependencies that might cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any specific aliases if needed
    }
    
    return config
  },
  
  // Add headers for better security and performance
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

// Use ES Module export syntax instead of CommonJS
export default nextConfig;