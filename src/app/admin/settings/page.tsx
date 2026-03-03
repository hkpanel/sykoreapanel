"use client";

import { useEffect, useState } from "react";
import {
  fetchProductionCapacity,
  saveProductionCapacity,
  DEFAULT_CAPACITY,
  type ProductionCapacity,
} from "@/lib/admin-db";

const FIELDS: { key: keyof ProductionCapacity; label: string; unit: string; desc: string }[] = [
  { key: "flashingPerDay", label: "후레싱", unit: "개/일", desc: "하루 생산 가능 후레싱 수량" },
  { key: "swingPerDay", label: "스윙도어 (≤2500)", unit: "조/일", desc: "하루 생산 가능 스윙도어 조 수" },
  { key: "hangaPerDay", label: "행가도어 (매장판)", unit: "조/일", desc: "하루 생산 가능 행가도어 조 수" },
  { key: "panelPerDay", label: "판넬", unit: "훼베/일", desc: "하루 생산 가능 판넬 훼베 수" },
  { key: "aluminumPerDay", label: "알루미늄", unit: "개/일", desc: "하루 출고 가능 알루미늄 수량" },
  { key: "accessoryPerDay", label: "부자재", unit: "개/일", desc: "하루 출고 가능 부자재 수량" },
];

export default function AdminSettingsPage() {
  const [cap, setCap] = useState<ProductionCapacity>(DEFAULT_CAPACITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProductionCapacity()
      .then(setCap)
      .catch(() => setCap(DEFAULT_CAPACITY))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveProductionCapacity(cap);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("기본값으로 초기화하시겠습니까?")) {
      setCap(DEFAULT_CAPACITY);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>설정 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1d1d1f", marginBottom: 6 }}>⚙️ 생산능력 설정</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>품목별 일일 생산 가능 수량을 설정합니다. 이 값으로 주문 시 예상 소요기간이 자동 계산됩니다.</p>
      </div>

      {/* 예시 안내 */}
      <div style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 12, background: "#f0f7ff", border: "1px solid #bbd6f5" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0066b3", marginBottom: 6 }}>💡 계산 방식</div>
        <div style={{ fontSize: 12, color: "#4a7db5", lineHeight: 1.8 }}>
          각 품목별 (주문수량 ÷ 일일생산량) = 소요일수를 구한 뒤 <b>전부 합산</b>하여 올림합니다.<br />
          예) 후레싱 100개(0.5일) + 스윙 30조(1.5일) + 행가 1조(0.5일) + 판넬 10훼베(0.1일) = 2.6일 → <b>약 3일</b>
        </div>
      </div>

      {/* 설정 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
        {FIELDS.map(f => (
          <div key={f.key} style={{ padding: "18px 20px", borderRadius: 14, background: "#fff", border: "1px solid #e8e8ed", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1d1d1f" }}>{f.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#86868b", background: "#f5f5f7", padding: "2px 8px", borderRadius: 6 }}>{f.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: "#86868b", marginBottom: 10 }}>{f.desc}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                value={cap[f.key]}
                onChange={e => setCap(prev => ({ ...prev, [f.key]: Math.max(1, Number(e.target.value) || 1) }))}
                min={1}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, border: "2px solid #e8e8ed",
                  fontSize: 18, fontWeight: 800, textAlign: "center", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                onBlur={e => e.target.style.borderColor = "#e8e8ed"}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#86868b", whiteSpace: "nowrap" }}>{f.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: "#aeaeb2", marginTop: 6 }}>
              기본값: {DEFAULT_CAPACITY[f.key]}
            </div>
          </div>
        ))}
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            padding: "12px 32px", borderRadius: 12, border: "none",
            background: saving ? "#d1d1d6" : "linear-gradient(135deg, #7b5ea7, #3ee6c4)",
            color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "wait" : "pointer",
          }}>
          {saving ? "⏳ 저장 중..." : "💾 저장"}
        </button>
        <button onClick={handleReset}
          style={{
            padding: "12px 24px", borderRadius: 12, border: "2px solid #e8e8ed",
            background: "#fff", color: "#6e6e73", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
          기본값 초기화
        </button>
        {saved && (
          <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>✅ 저장 완료!</span>
        )}
      </div>
    </div>
  );
}
