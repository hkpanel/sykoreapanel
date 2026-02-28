// ═══════════════════════════════════════════════════════
// SY한국판넬 스윙도어 견적 데이터 (엑셀 백데이터 1:1 변환)
// ═══════════════════════════════════════════════════════

const AL_PRICE = 7700; // 단가시트 C21

// ─── 단가 테이블 ───
const UNIT_PRICES = {
  외날가스켓: 300,
  경첩: 700,
  아교도시: 5000,
  리벳: 25,
  // 도어락
  원형락: 4000,
  멍텅락: 4000,
  컵핸들: 9000,
  데드락: 8000,
  도어레버락: 10000,
  // 유리
  "600x600일반유리": 8000,
  "800x800일반유리": 16000,
  "1000x1000일반유리": 25000,
  "600x600강화유리": 30000,
  "800x800강화유리": 50000,
  "1000x1000강화유리": 70000,
  "600x600아크릴": 40000,
  "800x800아크릴": 60000,
  "1000x1000아크릴": 90000,
  // 판넬
  "40T_EPS": 15000,
  "40T_우레탄": 30000,
  // 인건비 단가
  "인건비_EPS": 6000,
  "인건비_우레탄": 12000,
  // 픽스창 인건비
  "픽스인건비": 20000,
};

// AL kg/m 테이블
const AL_KG: Record<string, number> = {
  "훼샤바": 0.2555,
  "픽스바": 0.1795,
  "후레임50T": 0.4827,
  "후레임75T": 0.601,
  "후레임100T": 0.65,
  "후레임125T": 0.7915,
  "후레임150T": 1.0027,
};

// ─── 옵션 정의 (UI용) ───
export const SWING_DOOR_TYPES = ["양개", "편개"] as const;

export const SWING_MATERIALS = [
  { id: "EPS", label: "EPS" },
  { id: "우레탄", label: "우레탄" },
];

export const SWING_COLORS = [
  { id: "아이보리", label: "아이보리" },
  { id: "일면은회색", label: "일면은회색", extra: "+1,500/훼베" },
  { id: "양면백색", label: "양면백색", extra: "+3,000/훼베" },
];

export const SWING_FRAME_THICKNESSES = ["50T", "75T", "100T", "125T", "150T"];
export const SWING_FRAME_SIDES = ["삼면", "사면"];

export const SWING_LOCKS = [
  { id: "없음", label: "없음", price: 0 },
  { id: "원형락", label: "원형락", price: 4000 },
  { id: "멍텅락", label: "멍텅락", price: 4000 },
  { id: "컵핸들", label: "컵핸들", price: 9000 },
  { id: "데드락", label: "데드락", price: 8000 },
  { id: "레버락", label: "레버락", price: 10000 },
];

export const SWING_GLASS_TYPES = [
  { id: "일반유리", label: "일반유리" },
  { id: "강화유리", label: "강화유리" },
  { id: "아크릴", label: "아크릴" },
];

// ─── 소매 마진 (행가도어와 동일) ───
export const RETAIL_MARGIN = 0.20;

// ─── 부자재 계산 (U2~U8) ───
function calcHardware(
  w: number, h: number,
  doorType: "편개" | "양개",
  material: string,
): { total: number; detail: Record<string, number> } {
  // U2 외날가스켓
  const gasketQty = Math.round(w * 2 / 1000 * 1000) / 1000;
  const gasket = gasketQty * UNIT_PRICES.외날가스켓;

  // U3 경첩 (LET 수식)
  const leafW = doorType === "양개" ? w / 2 : w;
  const heightFactor = h <= 2100 ? 2.1 : h / 1000;
  const area = (leafW / 1000) * heightFactor;
  const baseQty = material === "EPS" ? 2 : 3;
  let addQty = 0;
  if (area > 4.5) addQty = 20;
  else if (area > 4) addQty = 10;
  else if (area > 3.5) addQty = 6;
  else if (area > 3) addQty = 4;
  else if (area > 2.5) addQty = 2;
  else if (area > 2.1) addQty = 1;
  const hingeQty = (baseQty + addQty) * (doorType === "양개" ? 2 : 1);
  const hinge = hingeQty * UNIT_PRICES.경첩;

  // U4 아교도시 (양개만)
  const glueQty = doorType === "양개" ? 1 : 0;
  const glue = glueQty * UNIT_PRICES.아교도시 * 2;

  // U5 리벳
  const rivetQty = Math.ceil(50 * (w * h / 2100000) / 10) * 10;
  const rivet = rivetQty * UNIT_PRICES.리벳;

  const total = gasket + hinge + glue + rivet;
  return {
    total,
    detail: { 외날가스켓: gasket, 경첩: hinge, 아교도시: glue, 리벳: rivet },
  };
}

// ─── 도어락 비용 (U9~U11) ───
function calcLock(
  lockType: string,
  doorType: "편개" | "양개",
): number {
  const lock = SWING_LOCKS.find(l => l.id === lockType);
  if (!lock || lock.price === 0) return 0;
  return lock.price * (doorType === "양개" ? 2 : 1);
}

// ─── 픽스창 비용 (U12~U17) ───
function calcFixWindow(
  hasFixWindow: boolean,
  fixW: number, fixH: number,
  glassType: string,
  doorType: "편개" | "양개",
): { total: number; detail: Record<string, number> } {
  if (!hasFixWindow) return { total: 0, detail: {} };

  const mul = doorType === "양개" ? 2 : 1;

  // U12 픽스바
  const pixBarQty = Math.ceil(((fixW + 40) + (fixH + 40)) * 4 * mul / 6300);
  const pixBar = pixBarQty * AL_KG["픽스바"] * AL_PRICE * 6.3;

  // U13 유리
  const glassArea = (fixW * fixH) / 100000;
  if (glassArea > 10) return { total: 0, detail: { error: -1 } }; // ERROR
  let sizeKey: string;
  if (glassArea <= 3.6) sizeKey = "600x600";
  else if (glassArea <= 6.4) sizeKey = "800x800";
  else sizeKey = "1000x1000";
  const glassKey = `${sizeKey}${glassType}` as keyof typeof UNIT_PRICES;
  const glassPrice = (UNIT_PRICES[glassKey] ?? 0) * mul;

  // U14 인건비
  const labor = UNIT_PRICES.픽스인건비 * mul;

  // CEILING to 10000
  const rawTotal = pixBar + glassPrice + labor;
  const total = Math.ceil(rawTotal / 10000) * 10000;

  return { total, detail: { 픽스바: pixBar, 유리: glassPrice, 인건비: labor } };
}

// ─── 알루미늄 (U18~U21) ───
function calcAluminum(
  w: number, h: number,
  doorType: "편개" | "양개",
  frameThick: string,   // "50T" 등
  frameSides: string,    // "삼면" | "사면"
  hasFrame: boolean,
): { total: number; detail: Record<string, number> } {
  const mul = doorType === "양개" ? 2 : 1;
  const leafW = doorType === "양개" ? w / 2 : w;

  // U18 훼샤바
  const fascia = ((leafW + 35) * 2 + (h + 35) * 2) * mul;
  const fasciaQty = Math.ceil(fascia / 6300 * 2) / 2; // CEILING to 0.5
  const fasciaAmt = fasciaQty * AL_KG["훼샤바"] * AL_PRICE * 6.3;

  // U19 후레임
  let frameAmt = 0;
  if (hasFrame) {
    let frameLen: number;
    if (frameSides === "삼면") {
      // ((H+60)*2) + ((W+90)*1) 편개 / 양개는 (W/2+95)
      frameLen = ((h + 60) * 2) + ((doorType === "양개" ? w + 95 : w + 90) * 1);
    } else {
      // 사면: ((H+90)*2) + ((W+90)*2) 편개 / 양개는 (W/2+95)
      frameLen = ((h + 90) * 2) + ((doorType === "양개" ? w + 95 : w + 90) * 2);
    }
    frameLen *= mul;
    const frameQty = Math.ceil(frameLen / 6500 * 2) / 2; // CEILING to 0.5
    const kgKey = `후레임${frameThick}` as keyof typeof AL_KG;
    const kgPerM = AL_KG[kgKey] ?? 0;
    // T19 = 6.5 * kg * AL가
    frameAmt = frameQty * kgPerM * AL_PRICE * 6.5;
  }

  const total = fasciaAmt + frameAmt;
  return { total, detail: { 훼샤바: fasciaAmt, 후레임: frameAmt } };
}

// ─── 판넬 (U22) ───
function calcPanel(
  w: number, h: number,
  material: string,
  color: string,
): { hwebe: number; cost: number } {
  // 훼베 = CEIL(W/1000) * 높이계수
  const heightFactor = h <= 2100 ? 2.1 : (h <= 2500 ? 2.5 : h / 1000);
  const hwebe = Math.ceil(w / 1000) * heightFactor;

  // 기본 단가
  let unitPrice = material === "우레탄" ? UNIT_PRICES["40T_우레탄"] : UNIT_PRICES["40T_EPS"];
  // 높이 추가금
  if (h > 3000) unitPrice += 15000;
  else if (h > 2500) unitPrice += 10000;
  else if (h > 2100) unitPrice += 5000;

  let cost = hwebe * unitPrice;

  // 색상 추가 (EPS만)
  if (material === "EPS") {
    if (color === "일면은회색") cost += hwebe * 1500;
    else if (color === "양면백색") cost += hwebe * 3000;
  }

  return { hwebe, cost };
}

// ─── 인건비 (U23) ───
function calcLabor(
  w: number, h: number,
  doorType: "편개" | "양개",
  material: string,
): number {
  const minArea = doorType === "양개" ? 4.2 : 2.1;
  const effectiveW = doorType === "양개" ? Math.max(w, 2000) : w;
  const heightFactor = h <= 2100 ? 2.1 : h / 1000;
  const calcArea = Math.ceil(effectiveW / 1000) * heightFactor;
  const area = Math.max(minArea, calcArea);
  const rate = material === "우레탄" ? UNIT_PRICES["인건비_우레탄"] : UNIT_PRICES["인건비_EPS"];
  return area * rate;
}

// ═══════════════════════════════════════════════════════
// 전체 스윙도어 견적
// ═══════════════════════════════════════════════════════
export function calcSwingDoorEstimate(input: {
  widthMm: number;
  heightMm: number;
  doorType: "편개" | "양개";
  material: string;        // "EPS" | "우레탄"
  color: string;           // "아이보리" | "일면은회색" | "양면백색"
  frameThick: string;      // "50T"~"150T"
  frameSides: string;      // "삼면" | "사면"
  hasFrame: boolean;
  hasFixWindow: boolean;
  fixW: number;
  fixH: number;
  glassType: string;       // "일반유리" | "강화유리" | "아크릴"
  lockType: string;        // "없음" | "원형락" | ...
}) {
  const { widthMm: w, heightMm: h, doorType } = input;

  // 1. 부자재
  const hw = calcHardware(w, h, doorType, input.material);

  // 2. 도어락
  const lockCost = calcLock(input.lockType, doorType);

  // 3. 픽스창
  const fix = calcFixWindow(
    input.hasFixWindow, input.fixW, input.fixH,
    input.glassType, doorType,
  );

  // 4. 알루미늄
  const al = calcAluminum(
    w, h, doorType,
    input.frameThick, input.frameSides, input.hasFrame,
  );

  // 5. 판넬
  const panel = calcPanel(w, h, input.material, input.color);

  // 6. 인건비
  const labor = calcLabor(w, h, doorType, input.material);

  // 7. 도매가 (엑셀 U24)
  // CEILING(U8*1.3 + U11 + U17 + U21*1.3 + U22 + U23, 1000)
  const wholesaleRaw = hw.total * 1.3 + lockCost + fix.total + al.total * 1.3 + panel.cost + labor;
  const wholesale = Math.ceil(wholesaleRaw / 1000) * 1000;

  // 8. 소매가 (25% 마진, 천원올림)
  const retailPrice = Math.ceil(wholesale / (1 - RETAIL_MARGIN) / 1000) * 1000;

  // 높이 2100 안내
  const sizeNote = h === 2100 ? "(실제사이즈는 2080입니다)" : "";

  return {
    // 원가 상세
    hardwareCost: hw.total,
    hardwareDetail: hw.detail,
    lockCost,
    fixWindowCost: fix.total,
    fixWindowDetail: fix.detail,
    alCost: al.total,
    alDetail: al.detail,
    panelCost: panel.cost,
    panelHwebe: panel.hwebe,
    laborCost: labor,
    // 합계
    wholesale,
    retailPrice,
    // 참고
    sizeNote,
  };
}
