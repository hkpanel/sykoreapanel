import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SY Korea Panel | 건축자재 전문기업",
  description: "스윙도어, 행가도어, 조립식판넬, 후레싱 전문 제조 - SYC 코인 결제 지원 | 평택 SY한국판넬",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "SY Korea Panel | 건축자재 전문기업",
    description: "스윙도어 · 행가도어 · 조립식판넬 · 후레싱 전문 제조 | 온라인 견적 · 간편 결제 · SYC 토큰",
    url: "https://www.sykoreapanel.com",
    siteName: "SY Korea Panel",
    images: [
      {
        url: "https://www.sykoreapanel.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "SY Korea Panel - 건축자재 전문기업",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SY Korea Panel | 건축자재 전문기업",
    description: "스윙도어 · 행가도어 · 조립식판넬 · 후레싱 전문 제조",
    images: ["https://www.sykoreapanel.com/og-image.png"],
  },
  verification: {
    other: {
      "naver-site-verification": "1a58741e284115bb5a9f89708ae41262f91d7446",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        {/* PortOne V2 결제 SDK */}
        <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
