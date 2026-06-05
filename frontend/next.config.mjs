/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/socket.io", destination: `${backend}/socket.io` },
      { source: "/socket.io/", destination: `${backend}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${backend}/socket.io/:path*` },
    ];
  },
};
export default nextConfig;
