/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'central.ddbms.local',
    'saigon.ddbms.local',
    'hanoi.ddbms.local',
    'hue.ddbms.local'
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  }
};

export default nextConfig;
