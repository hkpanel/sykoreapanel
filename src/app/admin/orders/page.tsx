"use client";

import { useEffect, useState } from "react";
import {
  fetchAllOrders, updateOrderDetails,
  DELIVERY_ESTIMATES, CARRIERS,
  type AdminOrder,
} from "@/lib/admin-db";

const STATUS_STEPS: { key: AdminOrder["status"]; label: string; icon: string; color: string; bg: string }[] = [
  { key: "paid", label: "결제완료", icon: "💳", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  { key: "confirmed", label: "주문확인", icon: "✅", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { key: "producing", label: "제작중", icon: "🔨", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { key: "shipped", label: "발송완료", icon: "📦", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { key: "delivered", label: "배송중", icon: "🚛", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  { key: "completed", label: "완료", icon: "✨", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { key: "cancelled", label: "취소", icon: "❌", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const getStep = (key: string) => STATUS_STEPS.find(s => s.key === key) || STATUS_STEPS[0];

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // 관리자 입력 상태 (펼침 시 개별 관리)
  const [editData, setEditData] = useState<Record<string, {
    trackingNumber?: string; trackingCarrier?: string;
    truckMemo?: string; estimatedDelivery?: string; adminMemo?: string;
  }>>({});

  const loadOrders = () => {
    setLoading(true);
    fetchAllOrders()
      .then(setOrders)
      .catch(err => console.error("주문 조회 실패:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  // 주문 펼칠 때 기존 데이터로 초기화
  const handleExpand = (order: AdminOrder) => {
    const id = order.id;
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setEditData(prev => ({
      ...prev,
      [id]: {
        trackingNumber: order.trackingNumber || "",
        trackingCarrier: order.trackingCarrier || "CJ대한통운",
        truckMemo: order.truckMemo || "",
        estimatedDelivery: order.estimatedDelivery || "",
        adminMemo: order.adminMemo || "",
      },
    }));
  };

  const updateField = (orderId: string, field: string, value: string) => {
    setEditData(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }));
  };

  // 상태 변경 + 저장
  const handleStatusChange = async (order: AdminOrder, newStatus: AdminOrder["status"], note?: string) => {
    if (saving) return;
    setSaving(order.id);
    try {
      const history = [...(order.statusHistory || []), { status: newStatus, at: new Date().toISOString(), note }];
      const ed = editData[order.id] || {};
      await updateOrderDetails(order.uid, order.id, {
        status: newStatus,
        statusHistory: history,
        trackingNumber: ed.trackingNumber || undefined,
        trackingCarrier: ed.trackingCarrier || undefined,
        truckMemo: ed.truckMemo || undefined,
        estimatedDelivery: ed.estimatedDelivery || undefined,
        adminMemo: ed.adminMemo || undefined,
      });
      setOrders(prev => prev.map(o => o.id === order.id ? {
        ...o, status: newStatus, statusHistory: history,
        ...ed,
      } : o));
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  // 메모만 저장 (상태 변경 없이)
  const handleSaveDetails = async (order: AdminOrder) => {
    if (saving) return;
    setSaving(order.id);
    try {
      const ed = editData[order.id] || {};
      await updateOrderDetails(order.uid, order.id, {
        trackingNumber: ed.trackingNumber || undefined,
        trackingCarrier: ed.trackingCarrier || undefined,
        truckMemo: ed.truckMemo || undefined,
        estimatedDelivery: ed.estimatedDelivery || undefined,
        adminMemo: ed.adminMemo || undefined,
      });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...ed } : o));
      alert("저장 완료!");
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const counts: Record<string, number> = { all: orders.length };
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  const formatKRW = (n: number) => "₩" + n.toLocaleString();
  const formatDate = (o: AdminOrder) => {
    if (o.createdAt) {
      const d = new Date(o.createdAt.seconds * 1000);
      return d.toLocaleDateString("ko-KR") + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    return o.paidAt ? new Date(o.paidAt).toLocaleDateString("ko-KR") : "-";
  };

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
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>주문 관리</h1>
          <p style={{ fontSize: 14, color: "#86868b" }}>총 {orders.length}건 · 클릭으로 상태 변경 + 송장/메모 입력</p>
        </div>
        <button onClick={loadOrders} style={{
          padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)", color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>🔄 새로고침</button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ key: "all", label: "전체", icon: "" }, ...STATUS_STEPS].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: filter === tab.key ? "1px solid rgba(96,165,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: filter === tab.key ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
            color: filter === tab.key ? "#60a5fa" : "#86868b", cursor: "pointer",
          }}>
            {tab.icon} {tab.label} ({counts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#86868b", fontSize: 14 }}>해당 상태의 주문이 없습니다</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(order => {
            const st = getStep(order.status);
            const isExpanded = expandedId === order.id;
            const ed = editData[order.id] || {};

            return (
              <div key={order.id} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: isExpanded ? "1px solid rgba(123,94,167,0.3)" : "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}>
                {/* 요약 행 */}
                <div onClick={() => handleExpand(order)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                  cursor: "pointer", flexWrap: "wrap",
                }}>
                  <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, whiteSpace: "nowrap" }}>
                    {st.icon} {st.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1, minWidth: 100 }}>
                    {order.items?.[0]?.productName || "-"}
                    {order.items.length > 1 && <span style={{ color: "#86868b" }}> 외 {order.items.length - 1}건</span>}
                  </span>
                  {/* 고객 요청 뱃지 */}
                  {order.deliveryNote && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontWeight: 700 }}>
                      {order.deliveryNote === "희망일 지정" ? `📅 ${order.preferredDate?.slice(5, 16) || "날짜미정"}` : order.deliveryNote}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>{formatKRW(order.totalAmount)}</span>
                  <span style={{ fontSize: 12, color: "#86868b", whiteSpace: "nowrap" }}>{formatDate(order)}</span>
                  <span style={{ fontSize: 14, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                </div>

                {/* 상세 펼침 */}
                {isExpanded && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>

                    {/* 상태 진행 바 */}
                    <div style={{ display: "flex", gap: 4, margin: "16px 0", overflowX: "auto", paddingBottom: 4 }}>
                      {STATUS_STEPS.filter(s => s.key !== "cancelled").map((step, idx) => {
                        const curIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
                        const stepIdx = idx;
                        const isActive = order.status === step.key;
                        const isPast = stepIdx < curIdx;
                        const isNext = stepIdx === curIdx + 1;
                        return (
                          <button key={step.key}
                            disabled={saving === order.id || (!isNext && !isActive)}
                            onClick={() => isNext && handleStatusChange(order, step.key)}
                            style={{
                              flex: 1, minWidth: 60, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                              border: isActive ? `2px solid ${step.color}` : isNext ? "2px dashed rgba(123,94,167,0.5)" : "1px solid rgba(255,255,255,0.06)",
                              background: isActive ? step.bg : isPast ? "rgba(52,211,153,0.06)" : "transparent",
                              color: isActive ? step.color : isPast ? "#34d399" : isNext ? "#a78bfa" : "#4a4a4a",
                              cursor: isNext ? "pointer" : "default",
                              opacity: saving === order.id ? 0.5 : 1,
                              textAlign: "center",
                            }}>
                            {isPast ? "✓" : step.icon}<br/>{step.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* 주문 상품 */}
                    <Section title="주문 상품">
                      {order.items.map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 3, fontSize: 13,
                        }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                            <span style={{ color: "#86868b", marginLeft: 8 }}>{item.size}{item.color ? ` / ${item.color}` : ""}</span>
                          </div>
                          <div style={{ whiteSpace: "nowrap" }}>
                            <span style={{ color: "#86868b" }}>{item.qty}개</span>
                            <span style={{ fontWeight: 700, marginLeft: 10 }}>{formatKRW(item.retailPrice * item.qty)}</span>
                          </div>
                        </div>
                      ))}
                    </Section>

                    {/* 고객 요청사항 */}
                    {(order.deliveryNote || order.customerMemo) && (
                      <Section title="📝 고객 요청사항">
                        <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.06)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.2)" }}>
                          {order.deliveryNote && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>
                              {order.deliveryNote === "희망일 지정" ? `📅 희망 수령일: ${order.preferredDate || "미정"}` : `⏱ ${order.deliveryNote}`}
                            </div>
                          )}
                          {order.customerMemo && (
                            <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.5 }}>💬 {order.customerMemo}</div>
                          )}
                        </div>
                      </Section>
                    )}

                    {/* 주문 정보 */}
                    <Section title="주문 정보">
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, fontSize: 12 }}>
                        <InfoBox label="주문번호" value={order.paymentId} />
                        <InfoBox label="결제수단" value={order.payMethod} />
                        <InfoBox label="배송방식" value={order.deliveryType === "parcel" ? "📦 택배" : order.deliveryType === "truck" ? "🚛 용차" : "🚗 직접수령"} />
                        <InfoBox label="상품금액" value={formatKRW(order.subtotal)} />
                        <InfoBox label="배송비" value={formatKRW(order.deliveryFee)} />
                        <InfoBox label="총액" value={formatKRW(order.totalAmount)} />
                      </div>
                    </Section>

                    {/* ─── 관리자 입력 영역 ─── */}
                    <div style={{ marginTop: 16, padding: 16, background: "rgba(123,94,167,0.06)", borderRadius: 14, border: "1px solid rgba(123,94,167,0.15)" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#a78bfa", marginBottom: 12 }}>🔧 관리자 입력</div>

                      {/* 예상 납기 */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 4, display: "block" }}>예상 납기</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {DELIVERY_ESTIMATES.map(est => (
                            <button key={est.value} onClick={() => updateField(order.id, "estimatedDelivery", est.value)}
                              title={est.desc}
                              style={{
                                padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                border: ed.estimatedDelivery === est.value ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                                background: ed.estimatedDelivery === est.value ? "rgba(167,139,250,0.15)" : "transparent",
                                color: ed.estimatedDelivery === est.value ? "#a78bfa" : "#9ca3af",
                              }}>{est.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* 택배 송장 (택배일 때만) */}
                      {order.deliveryType === "parcel" && (
                        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ flex: "0 0 120px" }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 4, display: "block" }}>택배사</label>
                            <select value={ed.trackingCarrier || "CJ대한통운"}
                              onChange={e => updateField(order.id, "trackingCarrier", e.target.value)}
                              style={{ width: "100%", padding: "7px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb", fontSize: 12 }}>
                              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 4, display: "block" }}>송장번호</label>
                            <input type="text" placeholder="송장번호 입력"
                              value={ed.trackingNumber || ""}
                              onChange={e => updateField(order.id, "trackingNumber", e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb", fontSize: 12, boxSizing: "border-box" }} />
                          </div>
                        </div>
                      )}

                      {/* 용차 메모 (용차일 때만) */}
                      {order.deliveryType === "truck" && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 4, display: "block" }}>용차 진행 메모</label>
                          <input type="text" placeholder="예: 3/15 오후 2시 도착 예정"
                            value={ed.truckMemo || ""}
                            onChange={e => updateField(order.id, "truckMemo", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb", fontSize: 12, boxSizing: "border-box" }} />
                        </div>
                      )}

                      {/* 관리자 내부 메모 */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 4, display: "block" }}>내부 메모 (고객 비공개)</label>
                        <textarea placeholder="내부 참고용 메모..."
                          value={ed.adminMemo || ""}
                          onChange={e => updateField(order.id, "adminMemo", e.target.value)}
                          rows={2}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb", fontSize: 12, resize: "none", boxSizing: "border-box" }} />
                      </div>

                      {/* 저장 + 취소 버튼 */}
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => handleSaveDetails(order)}
                          disabled={saving === order.id}
                          style={{
                            padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "#7b5ea7", color: "#fff", fontSize: 13, fontWeight: 700,
                            opacity: saving === order.id ? 0.5 : 1,
                          }}>💾 저장</button>
                        {order.status !== "cancelled" && (
                          <button onClick={() => {
                            if (confirm("정말 이 주문을 취소하시겠습니까?")) handleStatusChange(order, "cancelled", "관리자 취소");
                          }}
                            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "transparent", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            주문취소
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 상태 이력 */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <Section title="📋 상태 이력">
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {order.statusHistory.map((h, i) => {
                            const s = getStep(h.status);
                            return (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                <span style={{ color: s.color, fontWeight: 700, minWidth: 70 }}>{s.icon} {s.label}</span>
                                <span style={{ color: "#6b7280" }}>{new Date(h.at).toLocaleString("ko-KR")}</span>
                                {h.note && <span style={{ color: "#9ca3af" }}>— {h.note}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </Section>
                    )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: "#86868b", fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px" }}>
      <div style={{ fontSize: 11, color: "#86868b", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
