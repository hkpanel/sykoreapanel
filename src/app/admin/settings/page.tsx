"use client";

import { useEffect, useState } from "react";
import {
  fetchProductionCapacity,
  saveProductionCapacity,
  DEFAULT_CAPACITY,
  type ProductionCapacity,
} from "@/lib/admin-db";

const FIELDS: {
  key: keyof ProductionCapacity;
  label: string;
  icon: string;
  unit: string;
  desc: string;
  color: string;
}[] = [
  { key: "flashingPerDay", label: "후레싱", icon: "🔩", unit: "개/일", desc: "하루 생산 가능 후레싱 수량", color: "#3b82f6" },
  { key: "swingPerDay", label: "스윙도어 (≤2500)", icon: "🚪", unit: "조/일", desc: "하루 생산 가능 스윙도어 조 수", color: "#8b5cf6" },
  { key: "hangaPerDay", label: "행가도어 (매장판)", icon: "🏗️", unit: "조/일", desc: "하루 생산 가능 행가도어 조 수", color: "#f59e0b" },
  { key: "panelPerDay", label: "판넬", icon: "📦", unit: "훼베/일", desc: "하루 생산 가능 판넬 훼베 수", color: "#10b981" },
  { key: "aluminumPerDay", label: "알루미늄", icon: "⚙️", unit: "개/일", desc: "하루 출고 가능 알루미늄 수량", color: "#6366f1" },
  { key: "accessoryPerDay", label: "부자재", icon: "🔧", unit: "개/일", desc: "하루 출고 가능 부자재 수량", color: "#ec4899" },
];

export default function AdminSettingsPage() {
  const [cap, setCap] = useState<ProductionCapacity>(DEFAULT_CAPACITY);
  const [newCap, setNewCap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchProductionCapacity()
      .then(data => {
        setCap(data);
        const init: Record<string, string> = {};
        for (const f of FIELDS) init[f.key] = data[f.key].toString();
        setNewCap(init);
      })
      .catch(() => {
        setCap(DEFAULT_CAPACITY);
        const init: Record<string, string> = {};
        for (const f of FIELDS) init[f.key] = DEFAULT_CAPACITY[f.key].toString();
        setNewCap(init);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: keyof ProductionCapacity) => {
    const val = parseInt(newCap[key]);
    if (isNaN(val) || val < 1) {
      alert("1 이상의 값을 입력하세요");
      return;
    }
    setSavingKey(key);
    try {
      const updated = { ...cap, [key]: val };
      await saveProductionCapacity(updated);
      setCap(updated);
      const f = FIELDS.find(f => f.key === key);
      alert(`${f?.label} 생산능력이 ${val}${f?.unit}로 변경되었습니다.\n※ 주문 시 예상 소요기간에 즉시 반영됩니다.`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("전체 항목을 기본값으로 초기화하시겠습니까?")) return;
    setSavingKey("all");
    try {
      await saveProductionCapacity(DEFAULT_CAPACITY);
      setCap(DEFAULT_CAPACITY);
      const init: Record<string, string> = {};
      for (const f of FIELDS) init[f.key] = DEFAULT_CAPACITY[f.key].toString();
      setNewCap(init);
      alert("기본값으로 초기화되었습니다.");
    } catch (err) {
      alert("초기화 실패: " + (err as Error).message);
    } finally {
      setSavingKey(null);
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>생산능력 설정</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>품목별 일일 생산 가능 수량을 설정합니다. 주문 시 예상 소요기간이 자동 계산됩니다.</p>
      </div>

      {/* ═══ 계산 방식 안내 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>💡 계산 방식</h2>
        <div style={{ fontSize: 13, color: "#86868b", lineHeight: 1.8 }}>
          각 품목별 (주문수량 ÷ 일일생산량) = 소요일수를 구한 뒤 <span style={{ color: "#60a5fa", fontWeight: 700 }}>전부 합산</span>하여 올림합니다.
        </div>
        <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 8 }}>
          예) 후레싱 100개(0.5일) + 스윙 30조(1.5일) + 행가 1조(0.5일) + 판넬 10훼베(0.1일) = 2.6일 → 약 3일
        </div>
      </div>

      {/* ═══ 품목별 설정 카드 ═══ */}
      {FIELDS.map(f => {
        const isSaving = savingKey === f.key || savingKey === "all";
        const changed = newCap[f.key] !== cap[f.key].toString();
        return (
          <div key={f.key} style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{f.icon} {f.label}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재 생산능력</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: f.color }}>
                  {cap[f.key].toLocaleString()}
                  <span style={{ fontSize: 14, color: "#86868b", fontWeight: 600, marginLeft: 8 }}>
                    {f.unit}
                  </span>
                </div>
              </div>
              <div style={{ height: 40, width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>새 값 ({f.unit})</div>
                  <input
                    type="number"
                    min="1"
                    value={newCap[f.key] || ""}
                    onChange={e => setNewCap(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{
                      width: 120, padding: "8px 12px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                      color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center",
                    }}
                  />
                </div>
                <button
                  onClick={() => handleSave(f.key)}
                  disabled={isSaving || !changed}
                  style={{
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    background: isSaving ? "#555" : f.color, color: "#fff", border: "none",
                    cursor: isSaving ? "wait" : "pointer", marginTop: 20,
                    opacity: !changed ? 0.5 : 1,
                  }}
                >
                  {isSaving ? "저장 중..." : "적용"}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 12 }}>
              {f.desc} · 기본값: {DEFAULT_CAPACITY[f.key]}
            </div>
          </div>
        );
      })}

      {/* ═══ 전체 초기화 ═══ */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleResetAll}
          disabled={savingKey === "all"}
          style={{
            padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
            color: "#86868b", cursor: "pointer",
          }}
        >
          전체 기본값 초기화
        </button>
      </div>
    </div>
  );
}
