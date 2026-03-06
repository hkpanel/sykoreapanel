"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FLASHING_PRODUCTS, RETAIL_MULTIPLIER, COLOR_DETAILS, type FlashingProduct } from "@/app/data/flashingProducts";
import { DEFAULT_AL_KG_PRICE, saveAlKgPrice } from "@/lib/pricing";

type PriceOverrides = Record<string, Record<string, Record<string, number>>>;

// 색상 자동계산 배수 (아이보리 기준)
const COLOR_RATIOS: Record<string, number> = {
  "기성단색": 1.2,
  "특이단색": 1.3,
  "프린트": 2.0,
};
// 자동계산 대상 색상들
const AUTO_COLORS = Object.keys(COLOR_RATIOS);
// 수동입력 색상 (아이보리 + 아연/스틸 등)
const isManualColor = (c: string) => !AUTO_COLORS.includes(c);

// 이형 mm당 단가 기본값
const DEFAULT_CUSTOM_PRICES: Record<string, number> = {
  "아이보리": 26,
  "기성단색": 28,
  "특이단색": 30.8,
  "프린트": 37,
  "아연1.0T": 54,
  "아연1.2T": 64.8,
  "스틸1.0T": 64,
};

export default function AdminProducts() {
  const [multiplier, setMultiplier] = useState(RETAIL_MULTIPLIER);
  const [newMultiplier, setNewMultiplier] = useState(RETAIL_MULTIPLIER.toString());
  const [saving, setSaving] = useState(false);
  const [alKgPrice, setAlKgPrice] = useState(DEFAULT_AL_KG_PRICE);
  const [newAlKgPrice, setNewAlKgPrice] = useState(DEFAULT_AL_KG_PRICE.toString());
  const [savingAl, setSavingAl] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");

  const [overrides, setOverrides] = useState<PriceOverrides>({});
  const [editValues, setEditValues] = useState<PriceOverrides>({});
  const [savingPrices, setSavingPrices] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // 이형 mm당 단가
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(DEFAULT_CUSTOM_PRICES);
  const [editCustom, setEditCustom] = useState<Record<string, string>>({});
  const [savingCustom, setSavingCustom] = useState(false);
  const [customChanged, setCustomChanged] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "settings", "pricing");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.retailMultiplier) { setMultiplier(data.retailMultiplier); setNewMultiplier(data.retailMultiplier.toString()); }
          if (data.alKgPrice) { setAlKgPrice(data.alKgPrice); setNewAlKgPrice(data.alKgPrice.toString()); }
          if (data.customFlashingPrices) { setCustomPrices({ ...DEFAULT_CUSTOM_PRICES, ...data.customFlashingPrices }); }
        }
        const priceRef = doc(db, "settings", "flashingPrices");
        const priceSnap = await getDoc(priceRef);
        if (priceSnap.exists()) setOverrides(priceSnap.data() as PriceOverrides);
      } catch (err) { console.error("설정 로드 실패:", err); }
    })();
  }, []);

  // 도매가 가져오기
  const getWholesale = (productId: string, sizeLabel: string, color: string, baseWholesale: number) => {
    const editVal = editValues[productId]?.[sizeLabel]?.[color];
    if (editVal !== undefined) return editVal;
    const overVal = overrides[productId]?.[sizeLabel]?.[color];
    if (overVal !== undefined) return overVal;
    return baseWholesale;
  };

  // 아이보리 매입가 수정 → 기성/특이/프린트 자동계산
  const handleEditPrice = (product: FlashingProduct, sizeLabel: string, color: string, value: string) => {
    const num = value === "" ? 0 : parseInt(value);
    if (isNaN(num)) return;

    const updates: Record<string, number> = { [color]: num };

    // 아이보리 수정 시 → 자동계산 색상들도 업데이트
    if (color === "아이보리") {
      for (const [autoColor, ratio] of Object.entries(COLOR_RATIOS)) {
        if (product.availableColors.includes(autoColor)) {
          updates[autoColor] = Math.round(num * ratio / 100) * 100;
        }
      }
    }

    setEditValues(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        [sizeLabel]: {
          ...prev[product.id]?.[sizeLabel],
          ...updates,
        },
      },
    }));
    setHasChanges(prev => ({ ...prev, [product.id]: true }));
  };

  // 제품별 가격 저장
  const handleSavePrices = async (productId: string) => {
    setSavingPrices(productId);
    try {
      const merged = { ...overrides };
      const productEdits = editValues[productId];
      if (productEdits) {
        merged[productId] = { ...merged[productId] };
        for (const size of Object.keys(productEdits)) {
          merged[productId][size] = { ...merged[productId]?.[size], ...productEdits[size] };
        }
      }
      await setDoc(doc(db, "settings", "flashingPrices"), merged);
      setOverrides(merged);
      setEditValues(prev => { const n = {...prev}; delete n[productId]; return n; });
      setHasChanges(prev => ({ ...prev, [productId]: false }));
      alert("저장 완료!");
    } catch { alert("저장 실패!"); } finally { setSavingPrices(null); }
  };

  // 이형 mm당 단가 저장
  const handleSaveCustom = async () => {
    setSavingCustom(true);
    try {
      const newPrices = { ...customPrices };
      for (const [k, v] of Object.entries(editCustom)) {
        const num = parseFloat(v);
        if (!isNaN(num)) newPrices[k] = num;
      }
      await setDoc(doc(db, "settings", "pricing"), { customFlashingPrices: newPrices }, { merge: true });
      setCustomPrices(newPrices);
      setEditCustom({});
      setCustomChanged(false);
      alert("이형 단가 저장 완료!");
    } catch { alert("저장 실패!"); } finally { setSavingCustom(false); }
  };

  const handleSaveMultiplier = async () => {
    const val = parseFloat(newMultiplier);
    if (isNaN(val) || val < 1 || val > 5) { alert("1.0 ~ 5.0 사이"); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "pricing"), { retailMultiplier: val }, { merge: true });
      setMultiplier(val);
      alert(`마진율 ${((val - 1) * 100).toFixed(0)}% (×${val})`);
    } catch { alert("저장 실패"); } finally { setSaving(false); }
  };

  const handleSaveAlKgPrice = async () => {
    const val = parseInt(newAlKgPrice);
    if (isNaN(val) || val < 1000 || val > 50000) { alert("1,000 ~ 50,000 사이"); return; }
    setSavingAl(true);
    try { await saveAlKgPrice(val); setAlKgPrice(val); alert(`알루미늄 ₩${val.toLocaleString()}/kg`); }
    catch { alert("저장 실패"); } finally { setSavingAl(false); }
  };

  const categories = [...new Set(FLASHING_PRODUCTS.map((p) => p.category))];
  const filtered = category === "all" ? FLASHING_PRODUCTS : FLASHING_PRODUCTS.filter((p) => p.category === category);
  const marginPct = ((multiplier - 1) * 100).toFixed(0);

  const inputStyle = (edited: boolean) => ({
    width: 70, padding: "4px 6px", borderRadius: 6, textAlign: "right" as const,
    border: edited ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.1)",
    background: edited ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
    color: "#f5f5f7", fontSize: 12, fontWeight: 700, outline: "none",
  });

  const autoStyle = {
    width: 70, padding: "4px 6px", borderRadius: 6, textAlign: "right" as const,
    border: "1px solid rgba(52,211,153,0.3)",
    background: "rgba(52,211,153,0.06)",
    color: "#34d399", fontSize: 12, fontWeight: 700,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>제품 / 가격 관리</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>후레싱 {FLASHING_PRODUCTS.length}종 · 아이보리 입력 → 기성(×1.2) 특이(×1.3) 프린트(×2.0) 자동</p>
      </div>

      {/* ═══ 마진율 ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🔧 마진율</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#34d399" }}>{marginPct}% <span style={{ fontSize: 14, color: "#86868b", fontWeight: 600 }}>(×{multiplier})</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" step="0.1" min="1" max="5" value={newMultiplier} onChange={(e) => setNewMultiplier(e.target.value)}
              style={{ width: 80, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center" }} />
            <button onClick={handleSaveMultiplier} disabled={saving || newMultiplier === multiplier.toString()}
              style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", opacity: newMultiplier === multiplier.toString() ? 0.5 : 1 }}>
              {saving ? "..." : "적용"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 알루미늄 ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>⚙️ 알루미늄 kg단가</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>₩{alKgPrice.toLocaleString()}<span style={{ fontSize: 14, color: "#86868b" }}>/kg</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" step="100" value={newAlKgPrice} onChange={(e) => setNewAlKgPrice(e.target.value)}
              style={{ width: 100, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center" }} />
            <button onClick={handleSaveAlKgPrice} disabled={savingAl || newAlKgPrice === alKgPrice.toString()}
              style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", opacity: newAlKgPrice === alKgPrice.toString() ? 0.5 : 1 }}>
              {savingAl ? "..." : "적용"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 이형 mm당 단가 ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📐 이형 후레싱 mm당 단가</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(customPrices).map(([color, price]) => {
            const editVal = editCustom[color];
            const displayVal = editVal !== undefined ? editVal : price.toString();
            return (
              <div key={color} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px", minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "#86868b", marginBottom: 4 }}>{color}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#86868b" }}>₩</span>
                  <input type="number" step="0.1" value={displayVal}
                    onChange={(e) => { setEditCustom(prev => ({ ...prev, [color]: e.target.value })); setCustomChanged(true); }}
                    style={{ width: 60, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f5f5f7", fontSize: 14, fontWeight: 700, outline: "none", textAlign: "right" }} />
                  <span style={{ fontSize: 11, color: "#86868b" }}>/mm</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSaveCustom} disabled={!customChanged || savingCustom}
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 800, background: customChanged ? "#8b5cf6" : "rgba(255,255,255,0.05)", color: customChanged ? "#fff" : "#555", border: "none", cursor: customChanged ? "pointer" : "default", opacity: customChanged ? 1 : 0.5 }}>
            {savingCustom ? "저장 중..." : "💾 이형 단가 저장"}
          </button>
        </div>
      </div>

      {/* ═══ 카테고리 필터 ═══ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setCategory("all")} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: category === "all" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)", color: category === "all" ? "#60a5fa" : "#86868b" }}>전체 ({FLASHING_PRODUCTS.length})</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: category === cat ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)", color: category === cat ? "#60a5fa" : "#86868b" }}>
            {cat} ({FLASHING_PRODUCTS.filter((p) => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* ═══ 제품 목록 ═══ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((product) => {
          const isExpanded = expandedProduct === product.id;
          const changed = hasChanges[product.id];
          return (
            <div key={product.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, border: changed ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏗️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {product.name}
                    {changed && <span style={{ marginLeft: 8, fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "2px 6px", borderRadius: 4 }}>수정됨</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#86868b" }}>{product.desc}</div>
                </div>
                <div style={{ fontSize: 12, color: "#86868b", whiteSpace: "nowrap" }}>{product.sizes.length}사이즈 × {product.availableColors.length}색상</div>
                <span style={{ fontSize: 16, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 11, color: "#86868b", padding: "8px 0", lineHeight: 1.6 }}>
                    💡 <b style={{ color: "#34d399" }}>아이보리</b> 입력 → <span style={{ color: "#34d399" }}>기성(×1.2) 특이(×1.3) 프린트(×2.0)</span> 자동계산 · 아연/스틸은 직접 입력
                  </div>
                  <div style={{ overflowX: "auto", marginTop: 4 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: "#86868b", fontWeight: 600 }}>사이즈</th>
                          {product.availableColors.map((c) => (
                            <th key={c} style={{ padding: "8px 6px", textAlign: "center", color: AUTO_COLORS.includes(c) ? "#34d399" : "#86868b", fontWeight: 600, whiteSpace: "nowrap", fontSize: 11 }}>
                              {COLOR_DETAILS[c]?.label || c}
                              {AUTO_COLORS.includes(c) && <div style={{ fontSize: 9, color: "#34d399" }}>×{COLOR_RATIOS[c]}</div>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizes.map((size) => (
                          <tr key={size.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>{size.label}</td>
                            {product.availableColors.map((c) => {
                              const baseW = size.wholesale[c] || 0;
                              const currentW = getWholesale(product.id, size.label, c, baseW);
                              const retail = Math.round(currentW * multiplier / 100) * 100;
                              const isAuto = AUTO_COLORS.includes(c);
                              const isEdited = (editValues[product.id]?.[size.label]?.[c] !== undefined);

                              return (
                                <td key={c} style={{ padding: "6px 4px", textAlign: "center" }}>
                                  {isAuto ? (
                                    // 자동계산 (읽기전용)
                                    <div style={autoStyle}>{currentW.toLocaleString()}</div>
                                  ) : (
                                    // 수동입력
                                    <input type="number" value={currentW || ""}
                                      onChange={(e) => handleEditPrice(product, size.label, c, e.target.value)}
                                      style={inputStyle(isEdited)} />
                                  )}
                                  <div style={{ fontSize: 10, color: "#34d399", marginTop: 2 }}>→ {retail.toLocaleString()}</div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                    {changed && (
                      <button onClick={() => { setEditValues(prev => { const n = {...prev}; delete n[product.id]; return n; }); setHasChanges(prev => ({...prev, [product.id]: false})); }}
                        style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "#86868b", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>취소</button>
                    )}
                    <button onClick={() => handleSavePrices(product.id)} disabled={!changed || savingPrices === product.id}
                      style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 800, background: !changed ? "rgba(255,255,255,0.05)" : "#3b82f6", color: !changed ? "#555" : "#fff", border: "none", cursor: !changed ? "default" : "pointer", opacity: !changed ? 0.5 : 1 }}>
                      {savingPrices === product.id ? "저장 중..." : "💾 저장"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
