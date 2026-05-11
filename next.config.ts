import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "http", hostname: "localhost" },
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
