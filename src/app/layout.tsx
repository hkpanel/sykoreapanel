import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
