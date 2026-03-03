"use client";
import { useState, useMemo, useEffect } from "react";
import {
  SWING_DOOR_TYPES, SWING_MATERIALS, SWING_COLORS,
  SWING_FRAME_THICKNESSES, SWING_FRAME_SIDES,
  SWING_LOCKS, SWING_GLASS_TYPES,
  SKIN_COLORS, calcSkinCost,
  calcSwingDoorEstimate,
} from "../data/swingDoorData";

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

function PillSelect({ options, value, onChange }: {
  options: { id: string; label: string; extra?: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            style={{
              padding: "8px 14px", borderRadius: 10, border: "2px solid",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: active ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#fff",
              color: active ? "#fff" : "#1d1d1f",
              borderColor: active ? "#7b5ea7" : "#e8e8ed",
            }}>
            {o.label}
            {o.extra && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>{o.extra}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function SwingDoorEstimator({ onAddCart, alKgPrice }: {
  onAddCart: (item: { key: string; productId: string; productName: string; size: string; color: string; retailPrice: number; qty: number }) => void;
  alKgPrice?: number;
}) {
  // 기본값: 양개 2000×2100
  const [doorType, setDoorType] = useState<"편개" | "양개">("편개");
  const [widthStr, setWidthStr] = useState("900");
  const [heightStr, setHeightStr] = useState("2100");
  const widthMm = Number(widthStr) || 0;
  const heightMm = Number(heightStr) || 0;
  const [material, setMaterial] = useState("EPS");
  const [color, setColor] = useState("아이보리");

  // 우레탄: 아이보리/양면백색만 (은회색 불가 - 생산안됨), extra 문구도 제거
  const availableColors = material === "우레탄"
    ? SWING_COLORS.filter(c => c.id !== "일면은회색").map(c => ({ ...c, extra: undefined }))
    : SWING_COLORS;

  // 우레탄으로 변경 시 은회색이면 자동 리셋
  useEffect(() => {
    if (material === "우레탄" && color === "일면은회색") {
      setColor("아이보리");
    }
  }, [material, color]);

  // 후레임
  const [hasFrame, setHasFrame] = useState(true);
  const [frameThick, setFrameThick] = useState("50T");
  const [frameSides, setFrameSides] = useState("삼면");

  // 픽스창
  const [hasFixWindow, setHasFixWindow] = useState(false);
  const [fixWStr, setFixWStr] = useState("600");
  const [fixHStr, setFixHStr] = useState("600");
  const fixW = Number(fixWStr) || 0;
  const fixH = Number(fixHStr) || 0;
  const [glassType, setGlassType] = useState("일반유리");

  // 도어락
  const [lockType, setLockType] = useState("원형락");

  // 덧방(스킨)
  const [outerSkin, setOuterSkin] = useState("없음");
  const [innerSkin, setInnerSkin] = useState("없음");

  const [qty, setQty] = useState(1);

  // 견적 계산
  const estimate = useMemo(() => {
    if (widthMm < 300 || heightMm < 300) return null;
    return calcSwingDoorEstimate({
      widthMm, heightMm, doorType, material, color,
      frameThick, frameSides, hasFrame,
      hasFixWindow, fixW, fixH, glassType, lockType,
      outerSkin, innerSkin, alKgPrice,
    });
  }, [widthMm, heightMm, doorType, material, color, frameThick, frameSides, hasFrame, hasFixWindow, fixW, fixH, glassType, lockType, outerSkin, innerSkin, alKgPrice]);

  const handleAddCart = () => {
    if (!estimate) return;
    const sizeParts = [
      `${widthMm}×${heightMm}`,
      material,
      hasFrame ? `${frameThick} ${frameSides}` : "후레임없음",
      lockType,
    ];
    if (hasFixWindow) sizeParts.push(`FIX ${fixW}×${fixH} ${glassType}`);
    onAddCart({
      key: `swing-${Date.now()}`,
      productId: "swing-door",
      productName: `스윙도어 ${doorType}`,
      size: sizeParts.join(" / "),
      color: estimate.colorDisplay,
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
          .estimator-layout > div { padding: 16px !important; border-radius: 16px !important; }
          .estimator-layout h3 { font-size: 14px !important; }
          .estimator-layout label { font-size: 12px !important; }
          .estimator-layout select { font-size: 12px !important; padding: 8px 10px !important; }
          .estimator-layout input { font-size: 13px !important; padding: 8px 10px !important; }
          .estimator-layout button { font-size: 11px !important; padding: 6px 12px !important; }
          .est-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; }
        }
      `}</style>
      {/* 상단 */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 className="estimator-title" style={{ fontSize: 32, fontWeight: 800, color: "#1d1d1f", marginBottom: 8 }}>스윙도어 맞춤 견적</h2>
        <p className="estimator-sub" style={{ fontSize: 15, color: "#86868b" }}>사이즈 · 옵션 선택하면 실시간 견적이 계산됩니다</p>
      </div>

      <div className="estimator-layout" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* 왼쪽: 옵션 */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>

          {/* 도어 기본 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>🚪 도어 기본</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>타입</label>
              <PillSelect options={SWING_DOOR_TYPES.map(t => ({ id: t, label: t === "편개" ? "편개 (1짝)" : "양개 (2짝)" }))} value={doorType} onChange={v => {
                const newType = v as "편개" | "양개";
                setDoorType(newType);
                if (newType === "양개") { setWidthStr("1800"); setHeightStr("2100"); }
                else { setWidthStr("900"); setHeightStr("2100"); }
              }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>폭 (mm)</label>
                <input type="number" value={widthStr} onChange={e => setWidthStr(e.target.value)}
                  min={300} max={5000} step={10} style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
              </div>
              <div>
                <label style={LABEL_STYLE}>높이 (mm)</label>
                <input type="number" value={heightStr} onChange={e => setHeightStr(e.target.value)}
                  min={300} max={5000} step={10} style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = "#7b5ea7"}
                  onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
                {heightMm === 2100 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: "#e74c3c", fontWeight: 600 }}>※ 실제사이즈는 2080입니다</div>
                )}
                {heightMm === 1800 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: "#e74c3c", fontWeight: 600 }}>※ 실제사이즈는 1780입니다</div>
                )}
              </div>
            </div>
          </div>

          {/* 판넬 종류 + 색상 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>📦 판넬</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>종류</label>
                <PillSelect options={SWING_MATERIALS} value={material} onChange={setMaterial} />
              </div>
              <div>
                <label style={LABEL_STYLE}>색상</label>
                <PillSelect options={availableColors} value={color} onChange={setColor} />
              </div>
            </div>
          </div>

          {/* 덧방(스킨) */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>
              🎨 덧방(스킨)
              <span style={{ fontSize: 11, fontWeight: 500, color: "#86868b", marginLeft: 8 }}>판넬 위에 다른 색상 시트 부착</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>외부 덧방</label>
                <select value={outerSkin} onChange={e => setOuterSkin(e.target.value)} style={SELECT_STYLE}>
                  {SKIN_COLORS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id === "없음" ? "없음" : `${c.label} (+${(calcSkinCost(c.id) / 10000).toFixed(1)}만)`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>내부 덧방</label>
                <select value={innerSkin} onChange={e => setInnerSkin(e.target.value)} style={SELECT_STYLE}>
                  {SKIN_COLORS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id === "없음" ? "없음" : `${c.label} (+${(calcSkinCost(c.id) / 10000).toFixed(1)}만)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(outerSkin !== "없음" || innerSkin !== "없음") && estimate && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#f0ebf8", fontSize: 12, color: "#7b5ea7", fontWeight: 600 }}>
                색상 표기: {estimate.colorDisplay}
                {estimate.skinCost > 0 && <span style={{ marginLeft: 8, color: "#e67e22" }}>+₩{estimate.skinCost.toLocaleString()}</span>}
              </div>
            )}
          </div>

          {/* 후레임 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>🔧 후레임</h3>
            <div style={{ marginBottom: 12 }}>
              <PillSelect options={[{ id: "있음", label: "있음" }, { id: "없음", label: "없음" }]} value={hasFrame ? "있음" : "없음"} onChange={v => setHasFrame(v === "있음")} />
            </div>
            {hasFrame && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={LABEL_STYLE}>두께</label>
                  <PillSelect options={SWING_FRAME_THICKNESSES.map(t => ({ id: t, label: t }))} value={frameThick} onChange={setFrameThick} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>면수</label>
                  <PillSelect options={SWING_FRAME_SIDES.map(s => ({ id: s, label: s }))} value={frameSides} onChange={setFrameSides} />
                </div>
              </div>
            )}
          </div>

          {/* 도어락 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>🔒 도어락</h3>
            <PillSelect options={SWING_LOCKS.map(l => ({ id: l.id, label: l.label }))} value={lockType} onChange={setLockType} />
          </div>

          {/* 픽스창 */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1d1d1f", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #f0f0f2" }}>🪟 픽스창</h3>
            <div style={{ marginBottom: 12 }}>
              <PillSelect options={[{ id: "없음", label: "없음" }, { id: "있음", label: "있음" }]} value={hasFixWindow ? "있음" : "없음"} onChange={v => setHasFixWindow(v === "있음")} />
            </div>
            {hasFixWindow && (
              <>
                <div className="est-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 12 }}>
                  <div>
                    <label style={LABEL_STYLE}>픽스창 폭 (mm)</label>
                    <input type="number" value={fixWStr} onChange={e => setFixWStr(e.target.value)}
                      min={100} max={2000} step={10} style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>픽스창 높이 (mm)</label>
                    <input type="number" value={fixHStr} onChange={e => setFixHStr(e.target.value)}
                      min={100} max={2000} step={10} style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>유리 종류</label>
                    <PillSelect options={SWING_GLASS_TYPES} value={glassType} onChange={setGlassType} />
                  </div>
                </div>
              </>
            )}
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
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>도어</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{doorType} {widthMm}×{heightMm}mm</span>
                  </div>
                  {estimate.sizeNote && (
                    <div style={{ textAlign: "right", fontSize: 11, color: "#e74c3c", fontWeight: 600, marginBottom: 6 }}>{estimate.sizeNote}</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>판넬</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{material} / {estimate.panelHwebe.toFixed(1)}훼베</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>색상</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{estimate.colorDisplay}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>후레임</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{hasFrame ? `${frameThick} ${frameSides}` : "없음"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6e6e73" }}>도어락</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{lockType}</span>
                  </div>
                  {hasFixWindow && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#6e6e73" }}>픽스창</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{fixW}×{fixH} / {glassType}</span>
                    </div>
                  )}
                  {estimate.skinCost > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{ fontSize: 13, color: "#e67e22" }}>덧방(스킨)</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e67e22" }}>+₩{estimate.skinCost.toLocaleString()}</span>
                    </div>
                  )}
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

                <button onClick={handleAddCart}
                  style={{
                    width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
                    background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)",
                    color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  }}>
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
            · 양개도어 후레임은 3면 기준, 아교도시 1개 포함<br />
            · 높이 2100mm = 실제 2080mm (표준 규격)<br />
            · 높이 1800mm = 실제 1780mm (표준 규격)<br />
            · 우레탄 판넬: EPS 대비 +40,000원<br />
            · 일면은회색 +1,500/훼베, 양면백색 +3,000/훼베 (EPS만)<br />
            · 덧방(스킨): 아이보리 +3만 / 기성·특이단색 +3.5만 / 프린트 +5만 (일면당)
          </div>
        </div>
      </div>
    </div>
  );
}
