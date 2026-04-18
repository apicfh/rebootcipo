/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['v0.blob.com'],
    unoptimized: true,
  },
  // Consenti richieste cross-origin dal vusercontent durante lo sviluppo
  allowedDevOrigins: [
    'vm-oqqo64unqts34vwbzeez26.vusercontent.net',
    'localhost',
    '127.0.0.1',
  ],
  webpack: (config, context) => {
    // Disabilita il caching webpack per evitare conflitti
    config.cache = false;
    return config;
  },
}

export default nextConfig
