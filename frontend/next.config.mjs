/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'central.ddbms.local',
    'saigon.ddbms.local',
    'hanoi.ddbms.local',
    'hue.ddbms.local'
  ]
};

export default nextConfig;
