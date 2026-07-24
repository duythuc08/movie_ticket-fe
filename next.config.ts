import type { NextConfig } from "next";

// IP LAN dùng để test từ thiết bị khác trong cùng mạng (đổi trong .env.local
// khi mạng đổi, không cần sửa code). Rỗng nếu không set (chỉ localhost).
const devLanHost = process.env.DEV_LAN_HOST;

const nextConfig: NextConfig = {
    allowedDevOrigins: devLanHost ? [devLanHost, `${devLanHost}:3000`] : [],
    images: {
        remotePatterns: [
            { protocol: "http", hostname: "localhost" },
            ...(devLanHost ? [{ protocol: "http" as const, hostname: devLanHost }] : []),
            { protocol: "https", hostname: "**" },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/api-proxy/:path*",
                destination: "http://localhost:8080/duythuc/:path*",
            },
        ];
    },
};

export default nextConfig;
