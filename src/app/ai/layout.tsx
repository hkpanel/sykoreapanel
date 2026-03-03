/**
 * SY.ai 공통 레이아웃
 * ──────────────────
 * /ai 하위 모든 페이지에 적용
 * 다크 테마 + 투자 서비스 전용 내비게이션
 *
 * 📌 src/app/ai/layout.tsx 에 배치
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { onAuthChange, signOut } from "@/lib/auth";

/* ─── SY.ai 서비스 메뉴 ─── */
const NAV_ITEMS = [
  { label: "DeepStock", href: "/ai/deepstock", icon: "📈", active: true },
  { label: "DeepCrypto", href: "#", icon: "₿", active: false, badge: "준비중" },
  { label: "DeepSoccer", href: "#", icon: "⚽", active: false, badge: "준비중" },
];

export default function AiLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#08080c", color: "#e8e8ed" }}>
      {/* ─── 글로벌 스타일 (SY.ai 전용) ─── */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .ai-layout * { font-family: 'Pretendard', -apple-system, sans-serif; box-sizing: border-box; }
        .ai-nav-link { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500;
          color: #8b8b9e; transition: all 0.2s; text-decoration: none; display: flex; align-items: center; gap: 6px; }
        .ai-nav-link:hover { color: #e8e8ed; background: rgba(255,255,255,0.05); }
        .ai-nav-link.active { color: #00d4aa; background: rgba(0,212,170,0.08); }
        .ai-nav-link .badge { font-size: 10px; background: rgba(255,255,255,0.08); color: #6b6b7e;
          padding: 2px 6px; border-radius: 4px; }
        .ai-btn-outline { padding: 8px 20px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
          background: transparent; color: #e8e8ed; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .ai-btn-outline:hover { border-color: #00d4aa; color: #00d4aa; }
        .ai-btn-primary { padding: 8px 20px; border: none; border-radius: 8px;
          background: linear-gradient(135deg, #00d4aa, #00b894); color: #08080c;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ai-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        @media (max-width: 768px) {
          .ai-nav-desktop { display: none !important; }
          .ai-nav-mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .ai-nav-mobile-toggle { display: none !important; }
          .ai-nav-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* ─── 상단 네비게이션 ─── */}
      <nav className="ai-layout" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,8,12,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* 로고 */}
          <Link href="/ai" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #00d4aa, #00b894)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>SY.ai</span>
            <span style={{
              fontSize: 10, color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.08)",
              padding: "2px 6px", borderRadius: 4,
            }}>BETA</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="ai-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} href={item.href}
                className={`ai-nav-link ${item.active ? "active" : ""}`}
                style={{ pointerEvents: item.active ? "auto" : "none", opacity: item.active ? 1 : 0.5 }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </Link>
            ))}
          </div>

          {/* 우측: 유저 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <>
                {/* 충전금 잔액 */}
                <Link href="/ai/credits" style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)",
                  }}>
                    <span style={{ fontSize: 12, color: "#00d4aa" }}>💰</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#00d4aa" }}>0원</span>
                  </div>
                </Link>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowMenu(!showMenu)} style={{
                    width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)", color: "#e8e8ed", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>
                    {user.displayName?.[0] || user.email?.[0] || "U"}
                  </button>
                  {showMenu && (
                    <div style={{
                      position: "absolute", right: 0, top: 44, minWidth: 180,
                      background: "#16161e", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12, padding: 8, zIndex: 200,
                    }}>
                      <div style={{ padding: "8px 12px", fontSize: 13, color: "#8b8b9e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {user.displayName || user.email}
                      </div>
                      <Link href="/ai/mypage" style={{ display: "block", padding: "10px 12px", fontSize: 13, color: "#e8e8ed", textDecoration: "none", borderRadius: 6 }}>
                        내 계정
                      </Link>
                      <Link href="/ai/credits" style={{ display: "block", padding: "10px 12px", fontSize: 13, color: "#e8e8ed", textDecoration: "none", borderRadius: 6 }}>
                        충전금 관리
                      </Link>
                      <Link href="/ai/trades" style={{ display: "block", padding: "10px 12px", fontSize: 13, color: "#e8e8ed", textDecoration: "none", borderRadius: 6 }}>
                        매매 이력
                      </Link>
                      <button onClick={() => { signOut(); setShowMenu(false); }} style={{
                        width: "100%", textAlign: "left", padding: "10px 12px", fontSize: 13,
                        color: "#ff6b6b", background: "none", border: "none", cursor: "pointer", borderRadius: 6,
                      }}>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/?login=true" className="ai-btn-outline" style={{ textDecoration: "none" }}>로그인</Link>
                <Link href="/?signup=true" className="ai-btn-primary" style={{ textDecoration: "none" }}>시작하기</Link>
              </>
            )}

            {/* 모바일 햄버거 */}
            <button className="ai-nav-mobile-toggle" onClick={() => setShowMenu(!showMenu)} style={{
              background: "none", border: "none", color: "#e8e8ed", fontSize: 20, cursor: "pointer",
              display: "none", alignItems: "center",
            }}>☰</button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {showMenu && (
          <div className="ai-nav-mobile-menu" style={{
            padding: "12px 24px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} href={item.href}
                className={`ai-nav-link ${item.active ? "active" : ""}`}
                onClick={() => setShowMenu(false)}
                style={{ pointerEvents: item.active ? "auto" : "none", opacity: item.active ? 1 : 0.5 }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ─── 페이지 콘텐츠 ─── */}
      <main className="ai-layout" style={{ minHeight: "calc(100vh - 64px)" }}>
        {children}
      </main>

      {/* ─── 하단 푸터 ─── */}
      <footer className="ai-layout" style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#4a4a5e", lineHeight: 1.8 }}>
            SY.ai는 투자 자문 서비스가 아닙니다. 모든 투자 판단은 본인 책임 하에 이루어져야 합니다.<br />
            과거 수익률이 미래 수익을 보장하지 않습니다. 원금 손실 위험이 있습니다.<br />
            © 2026 SY.ai · SY한국판넬 · SY Coin Project
          </div>
        </div>
      </footer>
    </div>
  );
}
