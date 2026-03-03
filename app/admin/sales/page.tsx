"use client";

import { useEffect, useState } from "react";
import { fetchAllOrders, aggregateSalesByDate, aggregateSalesByMonth, type AdminOrder, type SalesStat } from "@/lib/admin-db";

export default function AdminSales() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => console.error("매출 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  const dailyStats = aggregateSalesByDate(orders);
  const monthlyStats = aggregateSalesByMonth(orders);
  const stats = view === "daily" ? dailyStats.slice(-30) : monthlyStats.slice(-12);

  const maxAmount = Math.max(...stats.map((s) => s.totalAmount), 1);
  const totalSales = stats.reduce((s, st) => s + st.totalAmount, 0);
  const totalOrders = stats.reduce((s, st) => s + st.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;

  const formatKRW = (n: number) => n.toLocaleString("ko-KR") + "원";

  // 카테고리별 매출
  const categoryMap = new Map<string, { count: number; amount: number }>();
  orders.filter((o) => o.status !== "cancelled").forEach((o) => {
    o.items.forEach((item) => {
      const cat = item.category || "기타";
      const label = cat === "flashing" ? "후레싱" : cat === "swing" ? "스윙도어" : cat === "hanga" ? "행가도어" : "기타";
      const existing = categoryMap.get(label) || { count: 0, amount: 0 };
      existing.count += item.qty;
      existing.amount += item.retailPrice * item.qty;
      categoryMap.set(label, existing);
    });
  });
  const categories = Array.from(categoryMap.entries()).sort((a, b) => b[1].amount - a[1].amount);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>매출 데이터 분석 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>매출 통계</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>
          {view === "daily" ? "최근 30일" : "최근 12개월"}
        </p>
      </div>

      {/* 요약 카드 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16, marginBottom: 28,
      }}>
        <SummaryCard label="총 매출" value={formatKRW(totalSales)} color="#60a5fa" />
        <SummaryCard label="총 주문" value={`${totalOrders}건`} color="#34d399" />
        <SummaryCard label="평균 주문 금액" value={formatKRW(avgOrderValue)} color="#fbbf24" />
      </div>

      {/* 일별/월별 토글 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["daily", "monthly"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
            background: view === v ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
            color: view === v ? "#60a5fa" : "#86868b",
          }}>
            {v === "daily" ? "일별" : "월별"}
          </button>
        ))}
      </div>

      {/* ═══ 바 차트 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28,
      }}>
        {stats.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#86868b", fontSize: 14 }}>
            데이터가 없습니다
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: view === "daily" ? 4 : 8, height: 240, overflowX: "auto", paddingBottom: 32 }}>
            {stats.map((s) => {
              const height = Math.max((s.totalAmount / maxAmount) * 200, 4);
              return (
                <div key={s.date} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  flex: view === "daily" ? "1 0 auto" : "1 0 60px", minWidth: view === "daily" ? 16 : 60,
                  position: "relative",
                }}>
                  {/* 금액 (호버 시 보이게) */}
                  <div style={{
                    fontSize: 10, color: "#86868b", marginBottom: 4, whiteSpace: "nowrap",
                    opacity: s.totalAmount > maxAmount * 0.5 ? 1 : 0.6,
                  }}>
                    {s.totalAmount >= 10000 ? `${Math.floor(s.totalAmount / 10000)}만` : formatKRW(s.totalAmount)}
                  </div>
                  {/* 바 */}
                  <div style={{
                    width: "100%", maxWidth: view === "daily" ? 20 : 48,
                    height, borderRadius: "6px 6px 2px 2px",
                    background: "linear-gradient(180deg, #60a5fa, #3b82f6)",
                    opacity: 0.8, transition: "height 0.3s ease",
                  }} />
                  {/* 날짜 */}
                  <div style={{
                    fontSize: 9, color: "#6e6e73", marginTop: 6, whiteSpace: "nowrap",
                    transform: view === "daily" ? "rotate(-45deg)" : "none",
                    transformOrigin: "top left",
                    position: view === "daily" ? "absolute" : "relative",
                    bottom: view === "daily" ? -24 : "auto",
                  }}>
                    {view === "daily" ? s.date.slice(5) : s.date}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ 카테고리별 매출 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>카테고리별 매출</h2>
        {categories.length === 0 ? (
          <div style={{ color: "#86868b", fontSize: 14 }}>데이터가 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categories.map(([cat, data]) => {
              const maxCat = categories[0][1].amount || 1;
              const pct = (data.amount / maxCat) * 100;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{cat}</span>
                    <span style={{ color: "#86868b" }}>{data.count}개 / {formatKRW(data.amount)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, width: `${pct}%`,
                      background: cat === "후레싱" ? "#60a5fa" : cat === "스윙도어" ? "#34d399" : cat === "행가도어" ? "#a78bfa" : "#fbbf24",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "18px 20px",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ fontSize: 12, color: "#86868b", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
