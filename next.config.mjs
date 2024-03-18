/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5328/api/:path*',
      },
    ];
  },
  assetPrefix: "/static/",
};

export default nextConfig;
