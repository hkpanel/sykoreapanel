import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SY Korea Panel | 건축자재 전문기업",
  description: "스윙도어, 행가도어, 조립식판넬, 후레싱 - SYC 코인 결제 지원",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
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
