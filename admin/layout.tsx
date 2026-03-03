"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAIL, isAdmin } from "@/lib/admin-db";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/orders", label: "주문 관리", icon: "📦" },
  { href: "/admin/products", label: "제품/가격", icon: "🏭" },
  { href: "/admin/members", label: "회원 관리", icon: "👥" },
  { href: "/admin/sales", label: "매출 통계", icon: "📈" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 로딩 중
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>관리자 인증 중...</div>
        </div>
      </div>
    );
  }

  // 비로그인 또는 권한 없음
  if (!user || !isAdmin(user.email)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117", color: "#fff" }}>
        <div style={{
          textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 20,
          padding: "48px 40px", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 400,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>접근 권한 없음</div>
          <div style={{ fontSize: 14, color: "#86868b", marginBottom: 24, lineHeight: 1.6 }}>
            관리자 계정({ADMIN_EMAIL})으로<br />로그인해야 접근할 수 있습니다.
          </div>
          <Link href="/" style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 12,
            background: "#fff", color: "#0f1117", fontWeight: 700, fontSize: 14,
            textDecoration: "none",
          }}>
            🏠 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // ═══ 관리자 인증 완료 → 레이아웃 렌더 ═══
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0f1117", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      <style>{`
        .admin-sidebar { width: 240px; background: #161822; border-right: 1px solid rgba(255,255,255,0.06); padding: 24px 0; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; transition: transform 0.3s ease; }
        .admin-main { flex: 1; margin-left: 240px; min-height: 100vh; }
        .admin-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; margin: 2px 12px; border-radius: 10px; color: #86868b; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.15s ease; }
        .admin-nav-item:hover { background: rgba(255,255,255,0.05); color: #f5f5f7; }
        .admin-nav-item.active { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .admin-hamburger { display: none; position: fixed; top: 16px; left: 16px; z-index: 200; width: 40px; height: 40px; border-radius: 10px; background: #161822; border: 1px solid rgba(255,255,255,0.1); color: #f5f5f7; font-size: 20px; cursor: pointer; align-items: center; justify-content: center; }
        .admin-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0; padding-top: 60px; }
          .admin-hamburger { display: flex; }
          .admin-overlay.open { display: block; }
        }
      `}</style>

      {/* 모바일 햄버거 */}
      <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* 오버레이 */}
      <div className={`admin-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* 사이드바 */}
      <nav className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f5f5f7" }}>🛠️ SY 관리자</div>
          <div style={{ fontSize: 11, color: "#86868b", marginTop: 4 }}>{user.email}</div>
        </div>

        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${pathname === item.href ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", margin: "0 12px",
          borderRadius: 10, color: "#86868b", textDecoration: "none", fontSize: 13, fontWeight: 600,
        }}>
          ← 홈으로
        </Link>
      </nav>

      {/* 메인 영역 */}
      <main className="admin-main" style={{ padding: "28px 32px", color: "#f5f5f7" }}>
        {children}
      </main>
    </div>
  );
}
