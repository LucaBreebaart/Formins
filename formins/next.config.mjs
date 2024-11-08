/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback.canvas = false;
      
      // Fix for PDF.js worker
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/[hash][ext][query]'
        }
      });
  
      return config;
    },
    experimental: {
      serverActions: true,
    },
    images: {
      domains: ['localhost'],
    },
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
      responseLimit: '10mb',
    },
  };
  
  export default nextConfig;