"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, type AdminUser } from "@/lib/admin-db";

export default function AdminMembers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch((err) => console.error("회원 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? users.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const formatKRW = (n: number) => n.toLocaleString("ko-KR") + "원";
  const formatDate = (ts: { seconds: number } | undefined) => {
    if (!ts) return "-";
    return new Date(ts.seconds * 1000).toLocaleDateString("ko-KR");
  };

  const providerLabel = (p: string) => {
    if (p?.includes("google")) return "🔵 Google";
    if (p?.includes("kakao")) return "🟡 Kakao";
    if (p?.includes("naver")) return "🟢 Naver";
    if (p?.includes("email") || p?.includes("password")) return "📧 이메일";
    return p || "-";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>회원 정보 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>회원 관리</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>총 {users.length}명</p>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="이메일 또는 이름으로 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", maxWidth: 400, padding: "10px 16px", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
          color: "#f5f5f7", fontSize: 14, outline: "none", marginBottom: 20,
        }}
      />

      {/* 회원 목록 */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["이름", "이메일", "가입경로", "주문수", "총 결제액", "가입일"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left", color: "#86868b",
                    fontWeight: 600, fontSize: 12, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                    {u.displayName || "(이름 없음)"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#86868b", fontSize: 12 }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>
                    {providerLabel(u.provider || "")}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>
                    {u.orderCount || 0}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                    {formatKRW(u.totalSpent || 0)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#86868b", fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatDate(u.createdAt as { seconds: number } | undefined)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#86868b", fontSize: 14 }}>
            {search ? "검색 결과가 없습니다" : "아직 회원이 없습니다"}
          </div>
        )}
      </div>
    </div>
  );
}
