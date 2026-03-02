"use client";

import { useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus, type AdminOrder } from "@/lib/admin-db";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "결제완료", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  preparing: { label: "준비중", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  shipping: { label: "배송중", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  delivered: { label: "배송완료", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  cancelled: { label: "취소", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const STATUS_FLOW: AdminOrder["status"][] = ["paid", "preparing", "shipping", "delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = () => {
    setLoading(true);
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => console.error("주문 조회 실패:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const formatKRW = (n: number) => n.toLocaleString("ko-KR") + "원";
  const formatDate = (o: AdminOrder) => {
    if (o.createdAt) {
      const d = new Date(o.createdAt.seconds * 1000);
      return d.toLocaleDateString("ko-KR") + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    if (o.paidAt) return new Date(o.paidAt).toLocaleDateString("ko-KR");
    return "-";
  };

  const handleStatusChange = async (order: AdminOrder, newStatus: AdminOrder["status"]) => {
    if (updating) return;
    setUpdating(order.id);
    try {
      await updateOrderStatus(order.uid, order.id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setUpdating(null);
    }
  };

  // 상태별 카운트
  const counts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>주문 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>주문 관리</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>총 {orders.length}건</p>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "전체" },
          { key: "paid", label: "결제완료" },
          { key: "preparing", label: "준비중" },
          { key: "shipping", label: "배송중" },
          { key: "delivered", label: "완료" },
          { key: "cancelled", label: "취소" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
            background: filter === tab.key ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
            color: filter === tab.key ? "#60a5fa" : "#86868b",
          }}>
            {tab.label} ({counts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#86868b", fontSize: 14 }}>
          해당 상태의 주문이 없습니다
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => {
            const st = STATUS_LABEL[order.status] || STATUS_LABEL.paid;
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                {/* 요약 행 */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                    cursor: "pointer", flexWrap: "wrap",
                  }}
                >
                  <span style={{
                    display: "inline-block", padding: "4px 10px", borderRadius: 8,
                    fontSize: 11, fontWeight: 700, color: st.color, background: st.bg,
                    whiteSpace: "nowrap",
                  }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1, minWidth: 120 }}>
                    {order.orderName || order.items?.[0]?.productName || "-"}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>
                    {formatKRW(order.totalAmount)}
                  </span>
                  <span style={{ fontSize: 12, color: "#86868b", whiteSpace: "nowrap" }}>
                    {formatDate(order)}
                  </span>
                  <span style={{ fontSize: 16, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                    ▾
                  </span>
                </div>

                {/* 상세 펼침 */}
                {isExpanded && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {/* 주문 상품 */}
                    <div style={{ marginTop: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: "#86868b", fontWeight: 600, marginBottom: 8 }}>주문 상품</div>
                      {order.items.map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 4,
                          fontSize: 13,
                        }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                            <span style={{ color: "#86868b", marginLeft: 8 }}>{item.size} / {item.color}{item.colorSub ? ` (${item.colorSub})` : ""}</span>
                          </div>
                          <div style={{ whiteSpace: "nowrap" }}>
                            <span style={{ color: "#86868b" }}>{item.qty}개</span>
                            <span style={{ fontWeight: 700, marginLeft: 12 }}>{formatKRW(item.retailPrice * item.qty)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 주문 정보 */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12, marginBottom: 16, fontSize: 13,
                    }}>
                      <InfoItem label="주문번호" value={order.paymentId} />
                      <InfoItem label="결제수단" value={order.payMethod} />
                      <InfoItem label="배송방식" value={order.deliveryType === "parcel" ? "택배" : order.deliveryType === "truck" ? "용차" : "직접수령"} />
                      <InfoItem label="상품금액" value={formatKRW(order.subtotal)} />
                      <InfoItem label="배송비" value={formatKRW(order.deliveryFee)} />
                      <InfoItem label="부가세" value={formatKRW(order.tax)} />
                    </div>

                    {/* 영수증 링크 */}
                    {order.receiptUrl && (
                      <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" style={{
                        display: "inline-block", padding: "6px 14px", borderRadius: 8,
                        fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.05)",
                        color: "#60a5fa", textDecoration: "none", marginBottom: 16,
                      }}>
                        🧾 영수증 보기
                      </a>
                    )}

                    {/* 상태 변경 버튼 */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#86868b", fontWeight: 600, lineHeight: "32px" }}>상태 변경:</span>
                      {STATUS_FLOW.map((s) => {
                        const sl = STATUS_LABEL[s];
                        const isCurrent = order.status === s;
                        return (
                          <button
                            key={s}
                            disabled={isCurrent || updating === order.id}
                            onClick={() => handleStatusChange(order, s)}
                            style={{
                              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              border: isCurrent ? `1px solid ${sl.color}` : "1px solid rgba(255,255,255,0.1)",
                              background: isCurrent ? sl.bg : "transparent",
                              color: isCurrent ? sl.color : "#86868b",
                              cursor: isCurrent ? "default" : "pointer",
                              opacity: updating === order.id ? 0.5 : 1,
                            }}
                          >
                            {sl.label}
                          </button>
                        );
                      })}
                      {order.status !== "cancelled" && (
                        <button
                          disabled={updating === order.id}
                          onClick={() => {
                            if (confirm("정말 이 주문을 취소하시겠습니까?")) {
                              handleStatusChange(order, "cancelled");
                            }
                          }}
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            border: "1px solid rgba(248,113,113,0.3)", background: "transparent",
                            color: "#f87171", cursor: "pointer",
                          }}
                        >
                          주문취소
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ fontSize: 11, color: "#86868b", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
