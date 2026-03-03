"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FLASHING_PRODUCTS, RETAIL_MULTIPLIER, COLOR_DETAILS, type FlashingProduct } from "@/app/data/flashingProducts";
import { DEFAULT_AL_KG_PRICE, saveAlKgPrice } from "@/lib/pricing";

export default function AdminProducts() {
  const [multiplier, setMultiplier] = useState(RETAIL_MULTIPLIER);
  const [newMultiplier, setNewMultiplier] = useState(RETAIL_MULTIPLIER.toString());
  const [saving, setSaving] = useState(false);
  const [alKgPrice, setAlKgPrice] = useState(DEFAULT_AL_KG_PRICE);
  const [newAlKgPrice, setNewAlKgPrice] = useState(DEFAULT_AL_KG_PRICE.toString());
  const [savingAl, setSavingAl] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");

  // Firestore에서 커스텀 마진율 + 알루미늄 단가 로드
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "settings", "pricing");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.retailMultiplier) {
            const m = data.retailMultiplier;
            setMultiplier(m);
            setNewMultiplier(m.toString());
          }
          if (data.alKgPrice) {
            const p = data.alKgPrice;
            setAlKgPrice(p);
            setNewAlKgPrice(p.toString());
          }
        }
      } catch (err) {
        console.error("설정 로드 실패:", err);
      }
    })();
  }, []);

  const handleSaveMultiplier = async () => {
    const val = parseFloat(newMultiplier);
    if (isNaN(val) || val < 1 || val > 5) {
      alert("1.0 ~ 5.0 사이의 값을 입력하세요");
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, "settings", "pricing");
      await setDoc(ref, { retailMultiplier: val }, { merge: true });
      setMultiplier(val);
      alert(`마진율이 ${((val - 1) * 100).toFixed(0)}% (×${val})로 변경되었습니다.\n※ 사이트에 즉시 반영됩니다.`);
    } catch (err) {
      console.error("마진율 저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAlKgPrice = async () => {
    const val = parseInt(newAlKgPrice);
    if (isNaN(val) || val < 1000 || val > 50000) {
      alert("1,000 ~ 50,000 사이의 값을 입력하세요");
      return;
    }
    setSavingAl(true);
    try {
      await saveAlKgPrice(val);
      setAlKgPrice(val);
      alert(`알루미늄 kg당 단가가 ₩${val.toLocaleString()}으로 변경되었습니다.\n※ 행가도어, 스윙도어, 크린룸AL, 도어AL 가격에 즉시 반영됩니다.`);
    } catch (err) {
      console.error("알루미늄 단가 저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSavingAl(false);
    }
  };

  // 카테고리 목록
  const categories = [...new Set(FLASHING_PRODUCTS.map((p) => p.category))];
  const filtered = category === "all" ? FLASHING_PRODUCTS : FLASHING_PRODUCTS.filter((p) => p.category === category);

  const marginPct = ((multiplier - 1) * 100).toFixed(0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>제품 / 가격 관리</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>후레싱 {FLASHING_PRODUCTS.length}종 + 스윙도어 + 행가도어</p>
      </div>

      {/* ═══ 마진율 설정 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🔧 마진율 설정</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재 마진율</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#34d399" }}>
              {marginPct}%
              <span style={{ fontSize: 14, color: "#86868b", fontWeight: 600, marginLeft: 8 }}>
                (도매가 × {multiplier})
              </span>
            </div>
          </div>
          <div style={{ height: 40, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>새 배수 (1.0 ~ 5.0)</div>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newMultiplier}
                onChange={(e) => setNewMultiplier(e.target.value)}
                style={{
                  width: 100, padding: "8px 12px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                  color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center",
                }}
              />
            </div>
            <button
              onClick={handleSaveMultiplier}
              disabled={saving || newMultiplier === multiplier.toString()}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: saving ? "#555" : "#3b82f6", color: "#fff", border: "none",
                cursor: saving ? "wait" : "pointer", marginTop: 20,
                opacity: newMultiplier === multiplier.toString() ? 0.5 : 1,
              }}
            >
              {saving ? "저장 중..." : "적용"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 12 }}>
          예시: 도매가 2,000원 × {multiplier} = 소비자가 {(2000 * multiplier).toLocaleString()}원
        </div>
      </div>

      {/* ═══ 알루미늄 kg당 단가 설정 ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>⚙️ 알루미늄 kg당 단가</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>현재 단가</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>
              ₩{alKgPrice.toLocaleString()}
              <span style={{ fontSize: 14, color: "#86868b", fontWeight: 600, marginLeft: 8 }}>
                /kg
              </span>
            </div>
          </div>
          <div style={{ height: 40, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>새 단가 (원/kg)</div>
              <input
                type="number"
                step="100"
                min="1000"
                max="50000"
                value={newAlKgPrice}
                onChange={(e) => setNewAlKgPrice(e.target.value)}
                style={{
                  width: 120, padding: "8px 12px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                  color: "#f5f5f7", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center",
                }}
              />
            </div>
            <button
              onClick={handleSaveAlKgPrice}
              disabled={savingAl || newAlKgPrice === alKgPrice.toString()}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: savingAl ? "#555" : "#f59e0b", color: "#fff", border: "none",
                cursor: savingAl ? "wait" : "pointer", marginTop: 20,
                opacity: newAlKgPrice === alKgPrice.toString() ? 0.5 : 1,
              }}
            >
              {savingAl ? "저장 중..." : "적용"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6e6e73", marginTop: 12 }}>
          ⚠️ 변경 시 행가도어, 스윙도어, 크린룸AL, 도어AL 가격이 전부 즉시 반영됩니다.
        </div>
      </div>

      {/* ═══ 카테고리 필터 ═══ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setCategory("all")} style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
          background: category === "all" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
          color: category === "all" ? "#60a5fa" : "#86868b",
        }}>
          전체 ({FLASHING_PRODUCTS.length})
        </button>
        {categories.map((cat) => {
          const count = FLASHING_PRODUCTS.filter((p) => p.category === cat).length;
          return (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
              background: category === cat ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
              color: category === cat ? "#60a5fa" : "#86868b",
            }}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* ═══ 제품 목록 ═══ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((product) => {
          const isExpanded = expandedProduct === product.id;
          return (
            <div key={product.id} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
            }}>
              {/* 제품 요약 */}
              <div
                onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                }}>
                  🏗️
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: "#86868b" }}>{product.desc}</div>
                </div>
                <div style={{ fontSize: 12, color: "#86868b", whiteSpace: "nowrap" }}>
                  {product.sizes.length}사이즈 × {product.availableColors.length}색상
                </div>
                <span style={{ fontSize: 16, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
              </div>

              {/* 가격표 */}
              {isExpanded && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: "#86868b", fontWeight: 600 }}>사이즈</th>
                          {product.availableColors.map((c) => (
                            <th key={c} style={{ padding: "8px 10px", textAlign: "right", color: "#86868b", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {COLOR_DETAILS[c]?.label || c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizes.map((size) => (
                          <tr key={size.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700 }}>{size.label}</td>
                            {product.availableColors.map((c) => {
                              const wholesale = size.wholesale[c] || 0;
                              const retail = Math.round(wholesale * multiplier);
                              return (
                                <td key={c} style={{ padding: "8px 10px", textAlign: "right" }}>
                                  <div style={{ fontWeight: 700 }}>{retail.toLocaleString()}</div>
                                  <div style={{ fontSize: 10, color: "#6e6e73" }}>도매 {wholesale.toLocaleString()}</div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
