"use client";

import { useEffect, useState } from "react";
import { fetchAllOrders, type AdminOrder } from "@/lib/admin-db";
import Link from "next/link";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "입금대기", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  paid: { label: "결제완료", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  confirmed: { label: "주문확인", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  producing: { label: "제작중", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  shipped: { label: "발송완료", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  delivered: { label: "배송중", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  completed: { label: "완료", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  cancelled: { label: "취소", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => console.error("주문 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  // ═══ 통계 계산 ═══
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const activeOrders = orders.filter((o) => o.status !== "cancelled");

  const todayOrders = activeOrders.filter((o) => {
    const d = o.createdAt
      ? new Date(o.createdAt.seconds * 1000).toISOString().slice(0, 10)
      : o.paidAt ? new Date(o.paidAt).toISOString().slice(0, 10) : "";
    return d === today;
  });

  const monthOrders = activeOrders.filter((o) => {
    const m = o.createdAt
      ? new Date(o.createdAt.seconds * 1000).toISOString().slice(0, 7)
      : o.paidAt ? new Date(o.paidAt).toISOString().slice(0, 7) : "";
    return m === thisMonth;
  });

  const todaySales = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const monthSales = monthOrders.reduce((s, o) => s + o.totalAmount, 0);

  const pendingCount = orders.filter((o) => o.status === "paid" || o.status === "pending_payment").length;
  const processingCount = orders.filter((o) => o.status === "confirmed" || o.status === "producing" || o.status === "shipped" || o.status === "delivered").length;

  const formatKRW = (n: number) => n.toLocaleString("ko-KR") + "원";
  const formatDate = (o: AdminOrder) => {
    if (o.createdAt) return new Date(o.createdAt.seconds * 1000).toLocaleDateString("ko-KR");
    if (o.paidAt) return new Date(o.paidAt).toLocaleDateString("ko-KR");
    return "-";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>데이터 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>대시보드</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>{today} 기준</p>
      </div>

      {/* ═══ 통계 카드 4개 ═══ */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, marginBottom: 32,
      }}>
        <StatCard icon="💰" label="오늘 매출" value={formatKRW(todaySales)} sub={`${todayOrders.length}건`} color="#60a5fa" />
        <StatCard icon="📅" label="이번 달 매출" value={formatKRW(monthSales)} sub={`${monthOrders.length}건`} color="#34d399" />
        <StatCard icon="🔔" label="처리 대기" value={`${pendingCount}건`} sub="결제완료 → 확인 필요" color="#fbbf24" />
        <StatCard icon="🚚" label="진행 중" value={`${processingCount}건`} sub="확인~배송중 주문" color="#a78bfa" />
      </div>

      {/* ═══ 최근 주문 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>최근 주문</h2>
          <Link href="/admin/orders" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>
            전체 보기 →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#86868b", fontSize: 14 }}>
            아직 주문이 없습니다
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["주문번호", "상품", "금액", "상태", "결제일"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#86868b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((o) => {
                  const st = STATUS_LABEL[o.status] || STATUS_LABEL.paid;
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#86868b", whiteSpace: "nowrap" }}>
                        {o.paymentId.slice(0, 20)}...
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.orderName || o.items?.[0]?.productName || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatKRW(o.totalAmount)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-block", padding: "4px 10px", borderRadius: 8,
                          fontSize: 11, fontWeight: 700, color: st.color, background: st.bg,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#86868b", whiteSpace: "nowrap" }}>
                        {formatDate(o)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ 통계 카드 컴포넌트 ═══
function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "20px 22px",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, color: "#86868b", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6e6e73" }}>{sub}</div>
    </div>
  );
}
