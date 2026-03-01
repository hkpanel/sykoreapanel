import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Firebase 인증을 커스텀 도메인으로 프록시
        // → 모바일에서 third-party cookie 차단 문제 해결
        source: "/__/auth/:path*",
        destination: "https://sykoreapanel-7f71c.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
