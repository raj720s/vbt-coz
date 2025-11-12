/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has ESLint errors.
    // !! WARN !!
    ignoreDuringBuilds: true,
  },
  // Vercel-specific optimizations
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  distDir: '.next',
  // Simplified configuration for better stability
  experimental: {
    typedRoutes: false,
    esmExternals: true,
  },
  serverExternalPackages: ['xlsx', 'multer', 'sharp'],
  // Fix for @tanstack/react-table ESM issues
  transpilePackages: ['@tanstack/react-table', '@tanstack/table-core'],
  // Webpack configuration for better builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Fix path alias resolution
    const srcPath = path.resolve(__dirname, 'src');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
    };
    
    // Ensure proper module resolution
    config.resolve.modules = [
      srcPath,
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ];
    
    // Additional module resolution settings for Vercel
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.mjs'];
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    // Fix for ESM modules like @tanstack/react-table
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
  
    return config;
  },
};

module.exports = nextConfig;
