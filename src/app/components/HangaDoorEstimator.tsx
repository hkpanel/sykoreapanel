"use client";
import { useState, useMemo } from "react";
import {
  PANEL_PRICES, PANEL_SUB_TYPES, PANEL_COLORS, PANEL_MATERIALS,
  DOOR_THICKNESSES, FINISH_THICKNESSES,
  TRACK_TYPES, ASSEMBLY_TYPES, ZINC_EXTRA_PER_HWEBE,
  calcHwebe, calcPanelCost, calcAlParts, calcLabor,
  RETAIL_MARGIN,
  calcHangaDoorEstimate,
} from "../data/hangaDoorData";

const SELECT_STYLE: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "2px solid #e8e8ed",
  fontSize: 14, background: "#fff", cursor: "pointer", outline: "none",
  width: "100%", boxSizing: "border-box",
};
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#6e6e73", marginBottom: 6, display: "block",
};
const INPUT_STYLE: React.CSSProperties = {
  ...SELECT_STYLE, MozAppearance: "textfield",
};

function PillSelect({ options, value, onChange, disabledSet }: {
  options: { id: string; label: string; desc?: string }[];
  value: string; onChange: (v: string) => void;
  disabledSet?: Set<string>;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => {
        const disabled = disabledSet?.has(o.id);
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => !disabled && onChange(o.id)}
            title={o.desc || ""}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "2px solid",
              fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              background: active ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : disabled ? "#f0f0f2" : "#fff",
              color: active ? "#fff" : disabled ? "#c8c8cc" : "#1d1d1f",
              borderColor: active ? "#7b5ea7" : disabled ? "#e8e8ed" : "#e8e8ed",
              opacity: disabled ? 0.5 : 1,
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HangaDoorEstimator({ onAddCart }: {
  onAddCart: (item: { key: string; productId: string; productName: string; size: string; color: string; retailPrice: number; qty: number }) => void;
}) {
  // 입력 상태
  const [doorType, setDoorType] = useState<"편개" | "양개">("양개");
  // 개구(타공) 사이즈 입력
  const [openWidthStr, setOpenWidthStr] = useState("4000");
  const [openHeightStr, setOpenHeightStr] = useState("4000");
  const openW = Number(openWidthStr) || 0;
  const openH = Number(openHeightStr) || 0;
  // 도어(실) 사이즈 — 기본: 개구+100, 수동 오버라이드 가능
  const [doorWidthOverride, setDoorWidthOverride] = useState("");
  const [doorHeightOverride, setDoorHeightOverride] = useState("");
  const widthMm = doorWidthOverride !== "" ? (Number(doorWidthOverride) || 0) : openW + 100;
  const heightMm = doorHeightOverride !== "" ? (Number(doorHeightOverride) || 0) : openH + 100;
  const [doorThick, setDoorThick] = useState("50T");
  const [finishThick, setFinishThick] = useState("50T");
  const [trackType, setTrackType] = useState("C트랙");
  const [assembly, setAssembly] = useState<"완조립" | "가조립" | "부속자재일체">("완조립");
  const [mfgType, setMfgType] = useState<"종제작" | "횡제작">("종제작");
  const [hasSideDoor, setHasSideDoor] = useState(false);

  // 판넬 상태 (판넬 두께는 도어 두께와 동일)
  const [panelType, setPanelType] = useState("내장");
  const [panelMaterial, setPanelMaterial] = useState("EPS");
  const [panelSubType, setPanelSubType] = useState("소골");
  const [panelColor, setPanelColor] = useState("아이보리");

  const [qty, setQty] = useState(1);

  // 판넬 단가 유효성 (null이면 해당 조합 없음) — 판넬 두께는 도어 두께와 동일
  const panelUnitPrice = useMemo(() => {
    const t = PANEL_PRICES[panelType];
    if (!t) return null;
    const m = t[panelMaterial];
    if (!m) return null;
    return m[doorThick] ?? null;
  }, [panelType, panelMaterial, doorThick]);

  // 준불연 + 도어두께 50T/75T면 경고
  const junBulConflict = panelMaterial === "준불연EPS" && (doorThick === "50T" || doorThick === "75T");

  // 징크 + 난연 비활성화
  const disabledMaterials = useMemo(() => {
    const s = new Set<string>();
    PANEL_MATERIALS.forEach(m => { if (!m.enabled) s.add(m.id); });
    if (panelType === "징크") s.add("난연EPS");
    return s;
  }, [panelType]);

  // 자동 보정: 징크+난연 → EPS로
  useMemo(() => {
    if (panelType === "징크" && panelMaterial === "난연EPS") {
      setPanelMaterial("EPS");
    }
  }, [panelType, panelMaterial]);

  // 타입 변경 시 세부타입/색상 리셋
  useMemo(() => {
    const subs = PANEL_SUB_TYPES[panelType] || [];
    if (!subs.includes(panelSubType)) setPanelSubType(subs[0] || "");
    const cols = PANEL_COLORS[panelType] || [];
    if (!cols.includes(panelColor)) setPanelColor(cols[0] || "");
  }, [panelType]);

  // 견적 계산 (판넬 두께 = 도어 두께)
  const estimate = useMemo(() => {
    if (widthMm < 500 || heightMm < 500) return null;
    if (junBulConflict) return null;
    return calcHangaDoorEstimate({
      widthMm, heightMm, doorType, doorThick, finishThick,
      trackType, assembly, panelType, panelMaterial, panelThickness: doorThick,
      panelColor, mfgType, hasSideDoor,
    });
  }, [widthMm, heightMm, doorType, doorThick, finishThick, trackType, assembly, panelType, panelMaterial, panelColor, mfgType, hasSideDoor, junBulConflict]);

  const handleAddCart = () => {
    if (!estimate) return;
    const sizeParts = [
      `개구${openW}×${openH}`,
      `도어${widthMm}×${heightMm}`,
      doorThick,
      `마감${finishThick}`,
      assembly,
      trackType,
      mfgType,
      `${panelType}-${panelMaterial}${panelSubType ? `-${panelSubType}` : ""}`,
    ];
    if (hasSideDoor) sizeParts.push("쪽문포함");
    onAddCart({
      key: `hanga-${Date.now()}`,
      productId: "hanga-door",
      productName: `행가도어 ${doorType}`,
      size: sizeParts.join(" / "),
      color: panelColor,
      retailPrice: estimate.retailPrice,
      qty,
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 80px" }}>
      <style>{`
        @media (max-width: 767px) {
          .estimator-layout { grid-template-columns: 1fr !important; }
          .estimator-title { font-size: 22px !important; }
          .estimator-sub { font-size: 13px !important; }
          .estimator-banner { padding: 8px 16px !important; }
          .estimator-banner span { font-size: 11px !important; }
          .estimator-layout > div { padding: 16px !important; border-radius: 16px !important; }
          .estimator-layout h3 { font-size: 14px !important; }
          .estimator-layout label { font-size: 12px !important; }
          .estimator-layout select { font-size: 12px !important; padding: 8px 10px !important; }
          .estimator-layout input { font-size: 13px !important; padding: 8px 10px !important; }
          .estimator-layout button { font-size: 11px !important; padding: 6px 12px !important; }
          .est-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; }
        }
      `}</style>
      {/* 상단 설명 */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 className="estimator-title" style={{ fontSize: 32, fontWeight: 800, color: "#1d1d1f", marginBottom: 8 }}>행가도어 맞춤 견적</h2>
        <p className="estimator-sub" style={{ fontSize: 15, color: "#86868b" }}>사이즈 · 옵션 선택하면 실시간 견적이 계산됩니다</p>
        <div className="estimator-banner" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, background: "#1a1a2e", padding: "10px 24px", borderRadius: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#f1c40f" }}>완조립 · 가조립 · 부속자재일체</span>
          <span style={{ fontSize: 13, color: "#86868b" }}>모든 방식 대응</span>
        </div>
      </div>

      <div className="estimator-layout" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* 왼쪽: 옵션 선택 */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>

          {/* 도어 기본 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>🚪 도어 기본</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>타입</label>
                <PillSelect options={[{ id: "양개", label: "양개 (2짝)" }, { id: "편개", label: "편개 (1짝)" }]} value={doorType} onChange={v => setDoorType(v as "편개" | "양개")} />
              </div>
              <div>
                <label style={LABEL_STYLE}>제작 방식</label>
                <PillSelect options={[{ id: "종제작", label: "종제작 (기본)" }, { id: "횡제작", label: "횡제작" }]} value={mfgType} onChange={v => setMfgType(v as "종제작" | "횡제작")} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <label style={LABEL_STYLE}>개구(타공) 폭 (mm)</label>
                <input type="number" value={openWidthStr} onChange={e => { setOpenWidthStr(e.target.value); setDoorWidthOverride(""); }}
                  min={400} max={15000} step={10} style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
              </div>
              <div>
                <label style={LABEL_STYLE}>개구(타공) 높이 (mm)</label>
                <input type="number" value={openHeightStr} onChange={e => { setOpenHeightStr(e.target.value); setDoorHeightOverride(""); }}
                  min={400} max={15000} step={10} style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 10 }}>
              <div>
                <label style={{ ...LABEL_STYLE, color: "#7b5ea7" }}>도어(실) 폭 (mm)</label>
                <input type="number" value={doorWidthOverride !== "" ? doorWidthOverride : String(widthMm)}
                  onChange={e => setDoorWidthOverride(e.target.value)}
                  min={500} max={15000} step={10}
                  style={{ ...INPUT_STYLE, background: doorWidthOverride !== "" ? "#fef7ff" : "#f9f9fb", borderColor: doorWidthOverride !== "" ? "#7b5ea7" : "#e8e8ed" }}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = doorWidthOverride !== "" ? "#7b5ea7" : "#e8e8ed"} />
              </div>
              <div>
                <label style={{ ...LABEL_STYLE, color: "#7b5ea7" }}>도어(실) 높이 (mm)</label>
                <input type="number" value={doorHeightOverride !== "" ? doorHeightOverride : String(heightMm)}
                  onChange={e => setDoorHeightOverride(e.target.value)}
                  min={500} max={15000} step={10}
                  style={{ ...INPUT_STYLE, background: doorHeightOverride !== "" ? "#fef7ff" : "#f9f9fb", borderColor: doorHeightOverride !== "" ? "#7b5ea7" : "#e8e8ed" }}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = doorHeightOverride !== "" ? "#7b5ea7" : "#e8e8ed"} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: doorWidthOverride !== "" || doorHeightOverride !== "" ? "#e34040" : "#86868b", marginTop: 6 }}>
              {doorWidthOverride !== "" || doorHeightOverride !== "" 
                ? "⚠️ 도어(실) 사이즈를 수동 입력했습니다"
                : "💡 도어(실) 사이즈 = 개구(타공) + 100mm (자동계산, 직접 수정 가능)"}
            </div>
          </div>

          {/* 도어 사양 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>⚙️ 도어 사양</h3>
            <div className="est-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>도어 두께</label>
                <select value={doorThick} onChange={e => setDoorThick(e.target.value)} style={SELECT_STYLE}>
                  {DOOR_THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>마감 두께</label>
                <select value={finishThick} onChange={e => setFinishThick(e.target.value)} style={SELECT_STYLE}>
                  {FINISH_THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>트랙</label>
                <select value={trackType} onChange={e => setTrackType(e.target.value)} style={SELECT_STYLE}>
                  {TRACK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <label style={LABEL_STYLE}>조립 방식</label>
                <PillSelect options={ASSEMBLY_TYPES.map(a => ({ id: a.id, label: a.label, desc: a.desc }))} value={assembly} onChange={v => setAssembly(v as "완조립" | "가조립" | "부속자재일체")} />
              </div>
              <div>
                <label style={LABEL_STYLE}>쪽문</label>
                <PillSelect options={[{ id: "없음", label: "없음" }, { id: "있음", label: "있음" }]} value={hasSideDoor ? "있음" : "없음"} onChange={v => setHasSideDoor(v === "있음")} />
              </div>
            </div>
          </div>

          {/* 판넬 */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>
              📦 판넬
              {assembly === "부속자재일체" && <span style={{ fontSize: 12, fontWeight: 600, color: "#e74c3c", marginLeft: 8 }}>※ 부속자재일체 → 판넬 미포함</span>}
            </h3>

            <div style={{ opacity: assembly === "부속자재일체" ? 0.4 : 1, pointerEvents: assembly === "부속자재일체" ? "none" : "auto" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL_STYLE}>타입</label>
                <PillSelect options={[{ id: "내장", label: "🏠 내장" }, { id: "외장", label: "🏗️ 외장" }, { id: "징크", label: "⚡ 징크" }]} value={panelType} onChange={setPanelType} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={LABEL_STYLE}>내장재</label>
                  <PillSelect options={PANEL_MATERIALS.map(m => ({ id: m.id, label: m.label }))} value={panelMaterial} onChange={setPanelMaterial} disabledSet={disabledMaterials} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>판넬 두께</label>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f5f5f7", fontSize: 14, fontWeight: 700, color: "#6e6e73" }}>
                    {doorThick} <span style={{ fontSize: 11, fontWeight: 500 }}>(도어 두께와 동일)</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>세부타입</label>
                  <PillSelect options={(PANEL_SUB_TYPES[panelType] || []).map(s => ({ id: s, label: s }))} value={panelSubType} onChange={setPanelSubType} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>색상</label>
                  <PillSelect options={(PANEL_COLORS[panelType] || []).map(c => ({ id: c, label: c }))} value={panelColor} onChange={setPanelColor} />
                </div>
              </div>
              {panelUnitPrice === null && assembly !== "부속자재일체" && !junBulConflict && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#fff3cd", fontSize: 12, color: "#856404" }}>
                  ⚠️ 해당 조합은 제작이 불가합니다. 다른 옵션을 선택해주세요.
                </div>
              )}
              {junBulConflict && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#fff3cd", fontSize: 12, color: "#856404" }}>
                  ⚠️ 준불연EPS는 100T 이상만 제작 가능합니다. 도어 두께를 100T 이상으로 변경해주세요.
                </div>
              )}
              {panelType === "징크" && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#e8f4fd", fontSize: 12, color: "#0c5460" }}>
                  ℹ️ 징크 타입은 공정비 +{ZINC_EXTRA_PER_HWEBE.toLocaleString()}원/훼베가 추가됩니다
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 견적 결과 */}
        <div style={{ position: "sticky", top: 72 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 2px 16px rgba(0,0,0,0.04)", border: "2px solid #e8e8ed" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1d1d1f", marginBottom: 20 }}>💰 견적 결과</h3>

            {estimate ? (
              <>
                {/* 요약 */}
                <div style={{ background: "#f5f5f7", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>개구(타공)</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{openW}×{openH}mm</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>도어(실)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: doorWidthOverride !== "" || doorHeightOverride !== "" ? "#7b5ea7" : "#1d1d1f" }}>{doorType} {widthMm}×{heightMm}mm</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>면적</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{estimate.areaSqM.toFixed(2)}㎡</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>판넬</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{estimate.panelSheets}장 ({estimate.panelHwebe.toFixed(1)}훼베)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>사양</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{doorThick} / {assembly}</span>
                  </div>
                </div>

                {/* 최종 가격 */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}>견적가 (VAT별도)</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#1d1d1f" }}>
                    ₩{estimate.retailPrice.toLocaleString()}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#7b5ea7" }}>
                      SYC {Math.round(estimate.retailPrice / 100).toLocaleString()} 코인
                    </span>
                    <span style={{ fontSize: 11, color: "#3ee6c4", fontWeight: 600 }}>(-10%)</span>
                  </div>
                </div>

                {/* 수량 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid #e8e8ed", background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>−</button>
                  <input type="number" value={qty} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setQty(v); else if (e.target.value === "") setQty(1); }}
                    onBlur={() => { if (qty < 1) setQty(1); }}
                    style={{ width: 56, height: 36, textAlign: "center", fontSize: 20, fontWeight: 800, border: "2px solid #e8e8ed", borderRadius: 10, outline: "none", MozAppearance: "textfield", WebkitAppearance: "none" }} min={1} />
                  <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid #e8e8ed", background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>+</button>
                </div>

                {qty > 1 && (
                  <div style={{ textAlign: "center", marginBottom: 16, fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>
                    총 ₩{(estimate.retailPrice * qty).toLocaleString()}
                  </div>
                )}

                {/* 장바구니 */}
                <button onClick={handleAddCart}
                  style={{
                    width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
                    background: (panelUnitPrice === null && assembly !== "부속자재일체") || junBulConflict
                      ? "#e8e8ed"
                      : "linear-gradient(135deg, #7b5ea7, #3ee6c4)",
                    color: "#fff", fontSize: 16, fontWeight: 800,
                    cursor: (panelUnitPrice === null && assembly !== "부속자재일체") || junBulConflict ? "not-allowed" : "pointer",
                  }}
                  disabled={(panelUnitPrice === null && assembly !== "부속자재일체") || junBulConflict}>
                  🛒 장바구니 담기
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#86868b" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
                <div style={{ fontSize: 14 }}>사이즈를 입력하면<br />견적이 자동 계산됩니다</div>
              </div>
            )}
          </div>

          {/* 참고사항 */}
          <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 14, background: "#fff", fontSize: 12, color: "#86868b", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>📋 참고사항</div>
            · VAT 별도 / 운반비 별도<br />
            · 완조립: 풀 조립 후 출고<br />
            · 가조립: 조립→해체 출고, 현장에서 쉽게 재조립<br />
            · 부속자재일체: 판넬 제외, 부속+자재 세트 출고<br />
            · 종제작(기본): 판넬을 옆으로 끼움<br />
            · 횡제작: 판넬을 아래에서 위로 쌓음
          </div>
        </div>
      </div>
    </div>
  );
}
