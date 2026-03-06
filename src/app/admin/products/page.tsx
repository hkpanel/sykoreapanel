"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FLASHING_PRODUCTS, RETAIL_MULTIPLIER, COLOR_DETAILS, type FlashingProduct } from "@/app/data/flashingProducts";
import { DEFAULT_AL_KG_PRICE, saveAlKgPrice } from "@/lib/pricing";

// Firestore 오버라이드 타입: { [productId]: { [sizeLabel]: { [color]: number } } }
type PriceOverrides = Record<string, Record<string, Record<string, number>>>;

export default function AdminProducts() {
  const [multiplier, setMultiplier] = useState(RETAIL_MULTIPLIER);
  const [newMultiplier, setNewMultiplier] = useState(RETAIL_MULTIPLIER.toString());
  const [saving, setSaving] = useState(false);
  const [alKgPrice, setAlKgPrice] = useState(DEFAULT_AL_KG_PRICE);
  const [newAlKgPrice, setNewAlKgPrice] = useState(DEFAULT_AL_KG_PRICE.toString());
  const [savingAl, setSavingAl] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");

  // 가격 오버라이드 (Firestore에서 로드)
  const [overrides, setOverrides] = useState<PriceOverrides>({});
  // 편집중인 값 (아직 저장 안 된 것)
  const [editValues, setEditValues] = useState<PriceOverrides>({});
  const [savingPrices, setSavingPrices] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // Firestore에서 설정 + 가격 오버라이드 로드
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "settings", "pricing");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.retailMultiplier) {
            setMultiplier(data.retailMultiplier);
            setNewMultiplier(data.retailMultiplier.toString());
          }
          if (data.alKgPrice) {
            setAlKgPrice(data.alKgPrice);
            setNewAlKgPrice(data.alKgPrice.toString());
          }
        }
        // 가격 오버라이드 로드
        const priceRef = doc(db, "settings", "flashingPrices");
        const priceSnap = await getDoc(priceRef);
        if (priceSnap.exists()) {
          setOverrides(priceSnap.data() as PriceOverrides);
        }
      } catch (err) {
        console.error("설정 로드 실패:", err);
      }
    })();
  }, []);

  // 실제 도매가 가져오기 (오버라이드 > 편집값 > 코드 기본값)
  const getWholesale = (productId: string, sizeLabel: string, color: string, baseWholesale: number) => {
    // 편집중인 값 우선
    const editVal = editValues[productId]?.[sizeLabel]?.[color];
    if (editVal !== undefined) return editVal;
    // Firestore 오버라이드
    const overVal = overrides[productId]?.[sizeLabel]?.[color];
    if (overVal !== undefined) return overVal;
    // 코드 기본값
    return baseWholesale;
  };

  // 도매가 편집
  const handleEditPrice = (productId: string, sizeLabel: string, color: string, value: string) => {
    const num = value === "" ? 0 : parseInt(value);
    if (isNaN(num)) return;
    setEditValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [sizeLabel]: {
          ...prev[productId]?.[sizeLabel],
          [color]: num,
        },
      },
    }));
    setHasChanges(prev => ({ ...prev, [productId]: true }));
  };

  // 제품별 가격 저장
  const handleSavePrices = async (productId: string) => {
    setSavingPrices(productId);
    try {
      // 기존 오버라이드 + 편집값 병합
      const merged = { ...overrides };
      const productEdits = editValues[productId];
      if (productEdits) {
        merged[productId] = { ...merged[productId] };
        for (const size of Object.keys(productEdits)) {
          merged[productId][size] = { ...merged[productId]?.[size], ...productEdits[size] };
        }
      }
      // Firestore 저장
      const priceRef = doc(db, "settings", "flashingPrices");
      await setDoc(priceRef, merged);
      setOverrides(merged);
      // 편집값 초기화
      setEditValues(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setHasChanges(prev => ({ ...prev, [productId]: false }));
      alert("저장 완료!");
    } catch (err) {
      console.error("가격 저장 실패:", err);
      alert("저장 실패!");
    } finally {
      setSavingPrices(null);
    }
  };

  const handleSaveMultiplier = async () => {
    const val = parseFloat(newMultiplier);
    if (isNaN(val) || val < 1 || val > 5) { alert("1.0 ~ 5.0 사이의 값을 입력하세요"); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "pricing"), { retailMultiplier: val }, { merge: true });
      setMultiplier(val);
      alert(`마진율이 ${((val - 1) * 100).toFixed(0)}% (×${val})로 변경되었습니다.`);
    } catch { alert("저장 실패"); } finally { setSaving(false); }
  };

  const handleSaveAlKgPrice = async () => {
    const val = parseInt(newAlKgPrice);
    if (isNaN(val) || val < 1000 || val > 50000) { alert("1,000 ~ 50,000 사이"); return; }
    setSavingAl(true);
    try {
      await saveAlKgPrice(val);
      setAlKgPrice(val);
      alert(`알루미늄 kg당 단가 ₩${val.toLocaleString()}으로 변경`);
    } catch { alert("저장 실패"); } finally { setSavingAl(false); }
  };

  const categories = [...new Set(FLASHING_PRODUCTS.map((p) => p.category))];
  const filtered = category === "all" ? FLASHING_PRODUCTS : FLASHING_PRODUCTS.filter((p) => p.category === category);
  const marginPct = ((multiplier - 1) * 100).toFixed(0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>제품 / 가격 관리</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>후레싱 {FLASHING_PRODUCTS.length}종 · 매입가 수정 → 판매가 자동 계산</p>
      </div>

      {/* ═══ 마진율 설정 ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🔧 마진율 설정</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재 마진율</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#34d399" }}>
              {marginPct}%
              <span style={{ fontSize: 14, color: "#86868b", fontWeight: 600, marginLeft: 8 }}>(도매가 × {multiplier})</span>
            </div>
          </div>
          <div style={{ height: 40, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>새 배수 (1.0 ~ 5.0)</div>
              <input type="number" step="0.1" min="1" max="5" value={newMultiplier} onChange={(e) => setNewMultiplier(e.target.value)}
                style={{ width: 100, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center" }} />
            </div>
            <button onClick={handleSaveMultiplier} disabled={saving || newMultiplier === multiplier.toString()}
              style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: saving ? "#555" : "#3b82f6", color: "#fff", border: "none", cursor: saving ? "wait" : "pointer", marginTop: 20, opacity: newMultiplier === multiplier.toString() ? 0.5 : 1 }}>
              {saving ? "저장 중..." : "적용"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 12 }}>예시: 도매가 2,000원 × {multiplier} = 소비자가 {(2000 * multiplier).toLocaleString()}원</div>
      </div>

      {/* ═══ 알루미늄 kg당 단가 ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>⚙️ 알루미늄 kg당 단가</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재 단가</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>₩{alKgPrice.toLocaleString()}<span style={{ fontSize: 14, color: "#86868b", fontWeight: 600, marginLeft: 8 }}>/kg</span></div>
          </div>
          <div style={{ height: 40, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>새 단가 (원/kg)</div>
              <input type="number" step="100" min="1000" max="50000" value={newAlKgPrice} onChange={(e) => setNewAlKgPrice(e.target.value)}
                style={{ width: 120, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center" }} />
            </div>
            <button onClick={handleSaveAlKgPrice} disabled={savingAl || newAlKgPrice === alKgPrice.toString()}
              style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: savingAl ? "#555" : "#f59e0b", color: "#fff", border: "none", cursor: savingAl ? "wait" : "pointer", marginTop: 20, opacity: newAlKgPrice === alKgPrice.toString() ? 0.5 : 1 }}>
              {savingAl ? "저장 중..." : "적용"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 12 }}>⚠️ 변경 시 행가/스윙/AL도어 가격 즉시 반영</div>
      </div>

      {/* ═══ 카테고리 필터 ═══ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setCategory("all")} style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
          background: category === "all" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
          color: category === "all" ? "#60a5fa" : "#86868b",
        }}>전체 ({FLASHING_PRODUCTS.length})</button>
        {categories.map((cat) => {
          const count = FLASHING_PRODUCTS.filter((p) => p.category === cat).length;
          return (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
              background: category === cat ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
              color: category === cat ? "#60a5fa" : "#86868b",
            }}>{cat} ({count})</button>
          );
        })}
      </div>

      {/* ═══ 제품 목록 ═══ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((product) => {
          const isExpanded = expandedProduct === product.id;
          const changed = hasChanges[product.id];
          return (
            <div key={product.id} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 14,
              border: changed ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
            }}>
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
                  <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: "#86868b", fontWeight: 600 }}>사이즈</th>
                          {product.availableColors.map((c) => (
                            <th key={c} style={{ padding: "8px 6px", textAlign: "center", color: "#86868b", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {COLOR_DETAILS[c]?.label || c}
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
                              const isEdited = (editValues[product.id]?.[size.label]?.[c] !== undefined) || (overrides[product.id]?.[size.label]?.[c] !== undefined && overrides[product.id]?.[size.label]?.[c] !== baseW);
                              return (
                                <td key={c} style={{ padding: "6px 4px", textAlign: "center" }}>
                                  <input
                                    type="number"
                                    value={currentW || ""}
                                    onChange={(e) => handleEditPrice(product.id, size.label, c, e.target.value)}
                                    style={{
                                      width: 70, padding: "4px 6px", borderRadius: 6, textAlign: "right",
                                      border: isEdited ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                      background: isEdited ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
                                      color: "#f5f5f7", fontSize: 12, fontWeight: 700, outline: "none",
                                    }}
                                  />
                                  <div style={{ fontSize: 10, color: "#34d399", marginTop: 2 }}>→ {retail.toLocaleString()}</div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* 저장 버튼 */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                    {changed && (
                      <button onClick={() => { setEditValues(prev => { const n = {...prev}; delete n[product.id]; return n; }); setHasChanges(prev => ({...prev, [product.id]: false})); }}
                        style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "#86868b", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                        취소
                      </button>
                    )}
                    <button onClick={() => handleSavePrices(product.id)}
                      disabled={!changed || savingPrices === product.id}
                      style={{
                        padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                        background: !changed ? "rgba(255,255,255,0.05)" : "#3b82f6", color: !changed ? "#555" : "#fff",
                        border: "none", cursor: !changed ? "default" : "pointer",
                        opacity: !changed ? 0.5 : 1,
                      }}>
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
