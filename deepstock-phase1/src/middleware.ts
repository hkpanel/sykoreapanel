/**
 * Next.js 미들웨어 — 도메인 기반 라우팅
 * ────────────────────────────────────────
 * syai.co.kr  → /ai/* 페이지로 라우팅
 * sykoreapanel.kr (또는 기타) → 기존 쇼핑몰 그대로
 *
 * 📌 이 파일을 src/middleware.ts 에 배치하세요
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** SY.ai 도메인 목록 (나중에 도메인 구매 후 추가) */
const AI_DOMAINS = [
  "syai.co.kr",
  "www.syai.co.kr",
  // 개발용 로컬 테스트: localhost:3000에서 /ai 직접 접근 허용
];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // ─── SY.ai 도메인으로 접속한 경우 ───
  if (AI_DOMAINS.some((d) => hostname.includes(d))) {
    // 루트("/")로 들어오면 → /ai 메인으로 리라이트
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/ai";
      return NextResponse.rewrite(url);
    }
    // /ai 로 시작하지 않는 경로면 → /ai 붙여서 리라이트
    // (단, _next, api, 정적파일은 제외)
    if (
      !pathname.startsWith("/ai") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.includes(".")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/ai${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ─── 일반 도메인 (sykoreapanel) → 기존 쇼핑몰 그대로 ───
  // /ai 경로는 어느 도메인에서든 직접 접근 가능 (개발 편의)
  return NextResponse.next();
}

export const config = {
  // 정적 파일, API, _next 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons).*)"],
};
