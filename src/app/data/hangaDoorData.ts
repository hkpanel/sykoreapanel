// ─────────────────────────────────────────
// SY한국판넬 행가도어 견적 데이터
// ─────────────────────────────────────────

import { calcSwingDoorEstimate } from "./swingDoorData";

// AL kg단가
export const AL_KG_PRICE = 7700;

// ─── 판넬 단가 (원/훼베) ─── 신호S&P 단가 +3,000원 ───
// null = 해당 조합 없음 (선택 불가)
export const PANEL_PRICES: Record<string, Record<string, Record<string, number | null>>> = {
  "내장": {
    "EPS":      { "50T": 12300, "75T": 13100, "100T": 13900, "125T": 14700, "150T": 15500 },
    "난연EPS":  { "50T": 13200, "75T": 14500, "100T": 15800, "125T": 17100, "150T": 18400 },
    "준불연EPS": { "50T": null, "75T": null, "100T": 26600, "125T": 29100, "150T": 31600 },
  },
  "외장": {
    "EPS":      { "50T": 14000, "75T": 14800, "100T": 15600, "125T": 16400, "150T": 17200 },
    "난연EPS":  { "50T": 15200, "75T": 16500, "100T": 17800, "125T": 19100, "150T": 20400 },
    "준불연EPS": { "50T": null, "75T": null, "100T": 27200, "125T": 29700, "150T": 32200 },
  },
  "징크": {
    "EPS":      { "50T": 21000, "75T": 21900, "100T": 23700, "125T": 23700, "150T": 24600 },
    "난연EPS":  { "50T": null, "75T": null, "100T": null, "125T": null, "150T": null },
    "준불연EPS": { "50T": null, "75T": null, "100T": 29900, "125T": 32400, "150T": 34900 },
  },
};

// 징크 공정비: 훼베당 5,000원 추가
export const ZINC_EXTRA_PER_HWEBE = 5000;

// ─── 판넬 세부타입 (같은 타입 내 동일 가격) ───
export const PANEL_SUB_TYPES: Record<string, string[]> = {
  "내장": ["소골", "민판"],
  "외장": ["500골", "1000골"],
  "징크": ["징크"],
};

// ─── 판넬 색상 (추가금 없음) ───
export const PANEL_COLORS: Record<string, string[]> = {
  "내장": ["아이보리", "은회색", "진회색"],
  "외장": ["아이보리", "은회색", "진회색"],
  "징크": ["징크블랙"],
};

// ─── 판넬 내장재 ───
export const PANEL_MATERIALS = [
  { id: "EPS", label: "EPS", enabled: true },
  { id: "난연EPS", label: "난연EPS (인증✕)", enabled: true },
  { id: "준불연EPS", label: "준불연EPS (인증)", enabled: true },
  { id: "우레탄", label: "우레탄", enabled: false },
  { id: "그라스울", label: "그라스울", enabled: false },
];

// ─── 판넬 두께 ───
export const PANEL_THICKNESSES = ["50T", "75T", "100T", "125T", "150T"];

// ─── 훼베 계산 ───
export function calcHwebe(
  widthMm: number, heightMm: number,
  doorType: "편개" | "양개",
  mfgType: "종제작" | "횡제작"
): { sheets: number; hwebe: number } {
  if (mfgType === "종제작") {
    // 종: 세로 기준, 판넬바 50mm 여유 있어서 (폭-50)/1000
    const w = doorType === "양개" ? widthMm / 2 : widthMm;
    const sheets1 = Math.ceil((w - 50) / 1000);
    const mul = doorType === "양개" ? 2 : 1;
    const sheets = sheets1 * mul;
    const hwebe = sheets * (heightMm / 1000);
    return { sheets, hwebe };
  } else {
    // 횡: 가로 기준, floor(높이/1000)+1 장 (딱 떨어져도 +1)
    const w = doorType === "양개" ? widthMm / 2 : widthMm;
    const sheets1 = Math.floor(heightMm / 1000) + 1;
    const mul = doorType === "양개" ? 2 : 1;
    const sheets = sheets1 * mul;
    const hwebe = sheets * (w / 1000);
    return { sheets, hwebe };
  }
}

// ─── 판넬 가격 계산 ───
export function calcPanelCost(
  hwebe: number,
  panelType: string,
  material: string,
  thickness: string
): number | null {
  const typePrice = PANEL_PRICES[panelType];
  if (!typePrice) return null;
  const matPrice = typePrice[material];
  if (!matPrice) return null;
  const price = matPrice[thickness];
  if (price === null || price === undefined) return null;

  let cost = hwebe * price;
  // 징크 추가 공정비
  if (panelType === "징크") {
    cost += hwebe * ZINC_EXTRA_PER_HWEBE;
  }
  return Math.round(cost);
}

// ─── AL 부품 kg/m (두께별) ───
export const AL_PARTS_KG: Record<string, Record<string, number>> = {
  "마감바": { "50T": 0.478, "75T": 0.57, "100T": 0.624, "125T": 0.8374, "150T": 0.98, "155T": 1.037, "없음": 0 },
  "편개바": { "50T": 0.52, "75T": 0.663, "100T": 1.006, "125T": 1.17, "150T": 1.8 },
  "양개바": { "50T": 0.54, "75T": 0.735, "100T": 1.14, "125T": 1.28, "150T": 2.1 },
  "가이드바": { "_": 0.539 },
  "C트랙": { "_": 1.4238 },
  "M트랙": { "_": 3.962 },
  "오핸들": { "_": 0.7281 },
  "훼샤바": { "_": 0.2555 },
  "후레임": { "50T": 0.4827, "75T": 0.601, "100T": 0.65, "125T": 0.7915, "150T": 1.0027 },
  "픽스바": { "_": 0.1795 },
};

// ─── AL 부품 길이(본 수) 계산 ─── 엑셀 백데이터 수식 그대로 변환 ───
// B4 = 편개면 폭 그대로, 양개면 폭/2
// C4 = 높이
// A4 = B4*2 (총 문폭)
// B6 = 도어두께 숫자만 (예: "100T" → 100)

export function calcAlParts(
  widthMm: number, heightMm: number,
  doorType: "편개" | "양개",
  doorThick: string,       // "50T"~"150T"
  finishThick: string,     // "없음" or "50T"~"155T"
  trackType: string,       // "C트랙" | "M트랙"
  panelType: string,       // "EPS" | "우레탄" | "그라스울" 등
  hasSideDoor: boolean,
  panelColor: string,
) {
  const B4 = doorType === "양개" ? widthMm / 2 : widthMm;
  const C4 = heightMm;
  const A4 = B4 * 2;
  const B6 = parseInt(doorThick.replace("T", ""));
  const isYangGae = doorType === "양개";
  const isPyeonGae = doorType === "편개";

  // === 부자재 수량 (G2~G20) ===
  const G2_sangbuBK = isYangGae ? 4 : 2;
  const G3_jungganBK = B4 >= 2500 ? 1 : 0;
  const G4_crankRoller = trackType === "M트랙"
    ? (() => {
        let base: number;
        if (panelType === "그라스울" && B4 >= 2300 && B4 < 2500) base = 3;
        else if (B4 < 2500) base = 2;
        else if (B4 < 4000) base = 3;
        else base = 4 + Math.floor((B4 - 4000) / 1000);
        return base * (isYangGae ? 2 : 1);
      })()
    : (isYangGae ? B4 * 2 / 1000 : B4 / 1000) + G3_jungganBK;
  const G5_guideRoller = isYangGae ? 2 : 1;
  const G6_yangGasket = isYangGae
    ? (B4 + C4) * 2 * 2 * 1.1 / 1000
    : (B4 + C4) * 2 * 1.1 / 1000;
  const G7_rubberStopper = 2;
  const G8_topStopper = 2;
  const G9_midStopper = isYangGae ? 1 : 0;
  const G10_bottomStopper = 2;
  const B11_factor = A4 < 1500 ? 0.5 : 1;
  const G11_inHandle = isYangGae ? 2 : 1;
  const G12_foldLatch = 1;
  const G13_handleCap = isYangGae ? 4 : 2;
  const G14_washer = 200;
  const G15_hexBolt = 10;
  const G16_washer45 = 10;
  const G17_nut = 10;
  const G18_rivet = isYangGae ? 400 : 200;
  const G19_anchor = 10;
  const G20_reinforcement = isYangGae ? 8 : 4;

  // 부자재 합계 (I21)
  const hardwareCost =
    G2_sangbuBK * 3100 + G3_jungganBK * 2900 +
    G4_crankRoller * (trackType === "M트랙" ? 25000 : 2900) +
    G5_guideRoller * 2700 + G6_yangGasket * 650 +
    G7_rubberStopper * 680 + G8_topStopper * 1900 +
    G9_midStopper * 1900 + G10_bottomStopper * 2300 +
    G11_inHandle * 650 + G12_foldLatch * 7900 +
    G13_handleCap * 200 + G14_washer * 66 +
    G15_hexBolt * 230 + G16_washer45 * 90 +
    G17_nut * 48 + G18_rivet * 24 +
    G19_anchor * 250 + G20_reinforcement * 1500;

  // === AL 부품 본 수 (G22~G32) - 6200mm 바 기준 절단 최적화 ===
  const barLen = 6.2; // 6200mm = 6.2m

  // G22: 마감바 (폭+100 + 높이+50 기준)
  const wBar = (widthMm + 100) / 6200;
  const hBar = (heightMm + 50) / 6200;
  const wFrac = wBar - Math.floor(wBar);
  const hFrac = hBar - Math.floor(hBar);
  const G22_finishBar =
    (wFrac <= 0.5
      ? wFrac * 1.5 + Math.floor(wBar)
      : Math.ceil(wBar))
    +
    (hFrac <= 0.5
      ? Math.round(hFrac * 2) + Math.floor(hBar) * 2
      : Math.ceil(hBar) * 2);

  // 헬퍼: 편개심플 바 계산 (G23 편개용, G24 편개용)
  const calcPyeonGaeBarSimple = () => {
    const bf = B4 / 6200;
    const bFrac = bf - Math.floor(bf);
    if (bFrac <= 0.5) return bFrac * 1.5 + Math.floor(bf);
    return Math.ceil(bf);
  };

  // 헬퍼: 양개 바 계산 (G23 양개용, G27 양개용)
  const calcYangGaeBar = () => {
    if ((B4 + C4 + 50) * 2 <= 6200) return Math.ceil((B4 + C4 + 50) * 2 / 6200);
    if ((C4 + B4 + 50) <= 6200) return Math.ceil((B4 + C4 + 50) / 6200) * 2;
    const bf = B4 / 6200;
    const bFrac = bf - Math.floor(bf);
    if (bFrac <= 0.5) return Math.round(bFrac * 2) + Math.floor(bf) * 2 + Math.ceil(C4 / 6200) * 2;
    return Math.ceil(bf) * 2 + Math.ceil(C4 / 6200) * 2;
  };

  // G23: 양개바 행 (편개일 때도 값 있음! I23은 양개바 kg 사용)
  const G23 = isPyeonGae ? calcPyeonGaeBarSimple() : calcYangGaeBar();

  // G27: 편개바 행 (양개일 때도 값 있음! I27은 편개바 kg 사용)
  const calcPyeonGaeBarFull = () => {
    if (B4 === 0 || C4 === 0) return 0;
    if (B4 + (C4 * 2) + 100 <= 6200) return Math.ceil((B4 + (C4 * 2) + 100) / 6200);
    if (B4 + C4 <= 6100 && B4 > 3100) return Math.ceil((B4 + C4) / 6200) + C4 / 6200 * 1.5;
    if (B4 + C4 <= 6100 && C4 > 3100) return Math.ceil((B4 + C4) / 6200) + Math.round(C4 / 6200);
    if (B4 <= 3050 && C4 <= 3050) return B4 / 6200 * 1.5 + Math.ceil(C4 * 2 / 6200);
    if (B4 <= 3050 && C4 > 3100) return B4 / 6200 * 1.5 + Math.ceil(C4 / 6200) * 2;
    if (B4 > 3100 && C4 <= 3050) return Math.ceil(B4 / 6200) + Math.round(C4 * 2 / 6200);
    return Math.ceil(B4 / 6200) + Math.ceil(C4 / 6200) * 2;
  };
  const G27 = isPyeonGae ? calcPyeonGaeBarFull() : calcYangGaeBar();

  // G24: 가이드바
  const calcGuideBarYang = () => {
    const bf = B4 / 6200;
    const bFrac = bf - Math.floor(bf);
    if (bFrac <= 0.5) return Math.round(bFrac * 2) + Math.floor(bf) * 2;
    return Math.ceil(bf) * 2;
  };
  const G24 = isPyeonGae ? calcPyeonGaeBarSimple() : calcGuideBarYang();

  // G31: 오핸들 (편개/양개 로직 미세하게 다름)
  const calcHandleBar = () => {
    if (isYangGae) {
      if ((B4 * 2) + 100 <= 3100) return ((B4 * 2) + 100) / 6200 * 1.5;
      const bf = B4 / 6200;
      const bFrac = bf - Math.floor(bf);
      if (bFrac <= 0.5) return Math.ceil(bFrac * 2) + Math.floor(bf) * 2;
      return Math.ceil(bf) * 2;
    } else {
      const bf = B4 / 6200;
      const bFrac = bf - Math.floor(bf);
      if (bFrac <= 0.5) return bFrac * 1.5 + Math.floor(bf);
      return Math.ceil(B4 * 2 / 6200);
    }
  };
  const G31 = calcHandleBar();

  // G32: 트랙 본 수
  const calcTrackBar = () => {
    if (isPyeonGae) {
      if (A4 <= 2900) return 0.5;
      if (A4 <= 6100) return 1;
      if (A4 <= 9000) return 1.5;
      if (A4 <= 12400) return 2;
      if (A4 <= 15000) return 2.5;
      if (A4 <= 18000) return 3;
      if (A4 <= 21000) return 3.5;
      return A4 * 0.25;
    } else {
      if (A4 <= 1450) return 0.5;
      if (A4 <= 3050) return 1;
      if (A4 <= 4500) return 1.5;
      if (A4 <= 6200) return 2;
      if (A4 <= 7500) return 2.5;
      if (A4 <= 9000) return 3;
      if (A4 <= 10500) return 3.5;
      return 4;
    }
  };
  const G32 = calcTrackBar();

  // === AL 부품별 금액 (kg단가 × 본 수 × 6.2m) ===
  const getKg = (part: string, thick: string): number => {
    const p = AL_PARTS_KG[part];
    if (!p) return 0;
    return p[thick] ?? p["_"] ?? 0;
  };

  // I22: 마감바 (없음이면 100T 기준으로 계산)
  const finishKg = finishThick === "없음" ? getKg("마감바", "100T") : getKg("마감바", finishThick);
  const I22 = G22_finishBar * finishKg * AL_KG_PRICE * barLen;

  // I23: 양개바 행 (편개에서도 양개바 kg 사용!)
  const I23 = G23 * getKg("양개바", doorThick) * AL_KG_PRICE * barLen;

  // I24: 가이드바
  const I24 = G24 * getKg("가이드바", "_") * AL_KG_PRICE * barLen;

  // I27: 편개바 행 (양개에서도 편개바 kg 사용!)
  const I27 = G27 * getKg("편개바", doorThick) * AL_KG_PRICE * barLen;

  // I31: 오핸들
  const I31 = G31 * getKg("오핸들", "_") * AL_KG_PRICE * barLen;

  // I32: 트랙 (없음이면 C트랙 기준)
  const trackKg = trackType === "M트랙" ? getKg("M트랙", "_") : getKg("C트랙", "_");
  const I32 = G32 * trackKg * AL_KG_PRICE * barLen;

  // I33: AL 합계
  const alTotal = I22 + I23 + I24 + I27 + I31 + I32;

  // 마감바/트랙 플래그
  const finishFlag = finishThick !== "없음" ? 1 : 0;
  const trackFlag = 1;

  // === 쪽문 (I34) ===
  const sideDoorCost = hasSideDoor
    ? calcSideDoorCost(doorThick, panelType, panelColor)
    : 0;

  // === 면적 (G36) ===
  const areaSqM = (isPyeonGae ? B4 : A4) * C4 / 1000000;

  // === 총합 ===
  return {
    hardwareCost: Math.round(hardwareCost),       // I21: 부자재
    alTotal: Math.round(alTotal),                  // I33: AL합계
    alDetail: {
      finish: Math.round(I22),                     // I22: 마감바
      yangGaeRow: Math.round(I23),                 // I23: 양개바행 (편개에서도 값 있음)
      guide: Math.round(I24),                      // I24: 가이드바
      pyeonGaeRow: Math.round(I27),                // I27: 편개바행 (양개에서도 값 있음)
      handle: Math.round(I31),                     // I31: 오핸들
      track: Math.round(I32),                      // I32: 트랙
    },
    sideDoorCost,                                  // I34: 쪽문
    areaSqM,                                       // G36: 면적(㎡)
    finishFlag,
    trackFlag,
    bars: { finish: G22_finishBar, g23: G23, guide: G24, g27: G27, handle: G31, track: G32 },
  };
}

// ─── 부자재 단가 (개당) ───
export const HARDWARE_PRICES: Record<string, number> = {
  "상부b/k": 3100,
  "중간b/k": 2900,
  "크랭크로라": 2900,
  "가이드로라": 2700,
  "양날가스켓": 650,
  "고무스토바": 680,
  "상부스토바": 1900,
  "중간스토바": 1900,
  "하부스토바": 2300,
  "인핸들": 650,
  "접빗장": 7900,
  "오핸들캡": 200,
  "와샤SDS35mm": 66,
  "육각볼트100mm": 230,
  "와샤45": 90,
  "너트3/8": 48,
  "리벳4.8x16": 24,
  "앙카3/8x75": 250,
  "65x65보강대": 1500,
};

// ─── 도어AL단가표 (소매가) ───
export const DOOR_AL_RETAIL: Record<string, number> = {
  "50T후레임": 39000,
  "75T후레임": 48000,
  "100T후레임": 52000,
  "125T후레임": 63000,
  "150T후레임": 80000,
  "C트랙": 130000,
  "M트랙": 300000,
  "50T마감바": 38000,
  "75T마감바": 44000,
  "100T마감바": 48000,
  "125T마감바": 64000,
  "150T마감바": 75000,
  "155T마감바": 80000,
  "손잡이바": 56000,
  "가이드바": 41000,
  "50T양개바": 42000,
  "75T양개바": 57000,
  "100T양개바": 87000,
  "125T양개바": 98000,
  "150T양개바": 160000,
  "50픽스바": 15000,
};

// ─── 인건비 (면적 기반) ───
export function calcLabor(
  areaSqM: number,
  assembly: "완조립" | "가조립" | "부속자재일체"
): number {
  if (assembly === "완조립") {
    if (areaSqM <= 2.2) return 50000;
    if (areaSqM <= 4.4) return 70000;
    if (areaSqM < 17) return 90000;
    return Math.round(areaSqM * 7000);
  }
  if (assembly === "가조립") {
    if (areaSqM <= 2.2) return 50000;
    if (areaSqM <= 4.4) return 70000;
    if (areaSqM < 17) return 90000;
    return Math.round(areaSqM * 7000 * 0.9);
  }
  // 부속자재일체
  if (areaSqM <= 2.2) return 50000;
  if (areaSqM <= 4.4) return 60000;
  if (areaSqM < 17) return 70000;
  return Math.round(areaSqM * 7000 * 0.7);
}

// ─── 쪽문 추가금 (스윙도어 900×2100 실제 견적 + 타공 인건비) ───
export function calcSideDoorCost(
  doorThickness: string,
  panelMaterial: string,
  panelColor: string
): number {
  // 타공 인건비 (두께별)
  const tapGongFee: Record<string, number> = {
    "50T": 40000,
    "75T": 50000,
    "100T": 50000,
    "125T": 60000,
    "150T": 70000,
  };

  // 스윙도어 900×2100 편개 기준 실제 견적
  const swingEst = calcSwingDoorEstimate({
    widthMm: 900,
    heightMm: 2100,
    doorType: "편개",
    material: panelMaterial === "우레탄" ? "우레탄" : "EPS",
    color: panelColor || "아이보리",
    frameThick: doorThickness,   // 프레임두께 = 도어두께
    frameSides: "삼면",
    hasFrame: true,
    hasFixWindow: false,
    fixW: 0,
    fixH: 0,
    glassType: "일반유리",
    lockType: "없음",
  });

  return swingEst.retailPrice + (tapGongFee[doorThickness] ?? 40000);
}

// ─── 소매 마진 ───
export const RETAIL_MARGIN = 0.25;
export function calcRetailPrice(materialCost: number, laborCost: number): number {
  return Math.ceil((materialCost + laborCost) / (1 - RETAIL_MARGIN) / 1000) * 1000;
}

// ─── 스윙도어 규격품 소매가 ───
export const SWING_DOOR_RETAIL: {
  type: string; sizes: string; doorPrice: number;
  frames: { thickness: string; framePrice: number; setPrice: number }[];
  notes: string[];
} [] = [
  {
    type: "편개",
    sizes: "800×1800 / 900×2100 / 1000×2100",
    doorPrice: Math.round(58000 * 1.25),
    frames: [
      { thickness: "50T", framePrice: Math.round(32000 * 1.25), setPrice: Math.round(90000 * 1.25) },
      { thickness: "75T", framePrice: Math.round(37500 * 1.25), setPrice: Math.round(95500 * 1.25) },
      { thickness: "100T", framePrice: Math.round(40000 * 1.25), setPrice: Math.round(98000 * 1.25) },
      { thickness: "125T", framePrice: Math.round(49500 * 1.25), setPrice: Math.round(107500 * 1.25) },
      { thickness: "150T", framePrice: Math.round(62000 * 1.25), setPrice: Math.round(120000 * 1.25) },
    ],
    notes: [],
  },
  {
    type: "양개",
    sizes: "1800×2100 / 2000×2100",
    doorPrice: Math.round(123000 * 1.25),
    frames: [
      { thickness: "50T", framePrice: Math.round(48000 * 1.25), setPrice: Math.round(171000 * 1.25) },
      { thickness: "75T", framePrice: Math.round(56500 * 1.25), setPrice: Math.round(179500 * 1.25) },
      { thickness: "100T", framePrice: Math.round(60000 * 1.25), setPrice: Math.round(183000 * 1.25) },
      { thickness: "125T", framePrice: Math.round(74500 * 1.25), setPrice: Math.round(197500 * 1.25) },
      { thickness: "150T", framePrice: Math.round(93000 * 1.25), setPrice: Math.round(216000 * 1.25) },
    ],
    notes: ["후레임 3면기준", "아교도시 1개기준, 추가 시 +5,000원"],
  },
];

export const SWING_DOOR_NOTES = [
  "원형락/멍텅락 +4,000원 | 컵핸들 +9,000원 | 데드락 +8,000원 | 도어레버락 +10,000원",
  "일면덧방: 아이보리 +30,000원 | 기타유색 +35,000원 | 징크외프린트 +50,000원",
  "우레탄: +40,000원 (편개)",
  "FIX창 600×600: +40,000원 (편개)",
  "일면은회색 +5,000원 | 양면백색 +10,000원",
];

// ─── 조립방식 ───
export const ASSEMBLY_TYPES = [
  { id: "완조립" as const, label: "완조립", desc: "풀 조립 후 출고" },
  { id: "가조립" as const, label: "가조립", desc: "조립→해체 후 출고, 현장에서 쉽게 재조립" },
  { id: "부속자재일체" as const, label: "부속자재일체", desc: "판넬 제외, 부속+자재 세트 출고" },
];

// ─── 도어 두께 ───
export const DOOR_THICKNESSES = ["50T", "75T", "100T", "125T", "150T"];

// ─── 마감 두께 ───
export const FINISH_THICKNESSES = ["없음", "50T", "75T", "100T", "125T", "150T", "155T"];

// ─── 트랙 ───
export const TRACK_TYPES = [
  { id: "C트랙", label: "C트랙", retail: 130000 },
  { id: "M트랙", label: "M트랙 (중량용)", retail: 300000 },
];

// ─── 전체 행가도어 견적 계산 ───
// 엑셀 M6 공식:
// ROUNDUP( ROUNDUP((자재원가+인건비)/(1-마진),-3) + 판넬비 - 마감차감 - 트랙차감, -3)
// ※ 판넬비는 마진 미적용! 원가 그대로 추가
// ※ 마감없음 → 마감바 AL비용 차감
// ※ 트랙없음 → 트랙 AL비용 차감 (현재 트랙없음 옵션 없음)
export function calcHangaDoorEstimate(input: {
  widthMm: number;
  heightMm: number;
  doorType: "편개" | "양개";
  doorThick: string;
  finishThick: string;
  trackType: string;
  assembly: "완조립" | "가조립" | "부속자재일체";
  panelType: string;       // "내장" | "외장" | "징크"
  panelMaterial: string;   // "EPS" | "난연EPS" | "준불연EPS"
  panelThickness: string;  // "50T"~"150T"
  panelColor: string;      // "아이보리" | "일면은회색" | "양면백색"
  mfgType: "종제작" | "횡제작";
  hasSideDoor: boolean;
}) {
  // 1. AL + 부자재 + 쪽문
  const al = calcAlParts(
    input.widthMm, input.heightMm, input.doorType,
    input.doorThick, input.finishThick, input.trackType,
    input.panelMaterial === "우레탄" ? "우레탄" : "EPS",
    input.hasSideDoor,
    input.panelColor || "아이보리",
  );

  // 2. 판넬 (훼베 계산 → 단가) — 마진 미적용!
  const hwebe = calcHwebe(input.widthMm, input.heightMm, input.doorType, input.mfgType);
  const panelCost = input.assembly === "부속자재일체"
    ? 0  // 부속자재일체는 판넬 제외
    : calcPanelCost(hwebe.hwebe, input.panelType, input.panelMaterial, input.panelThickness) ?? 0;

  // 3. 인건비 (천원 올림)
  const laborRaw = calcLabor(al.areaSqM, input.assembly);
  const labor = Math.ceil(laborRaw / 1000) * 1000;

  // 4. 자재원가 = 부자재 + AL (쪽문 제외! 쪽문은 이미 소매가)
  const materialCost = al.hardwareCost + al.alTotal;

  // 5. 마감/트랙 차감
  // 마감 없음 → 마감바 AL비용 차감
  const finishDeduct = input.finishThick === "없음" ? al.alDetail.finish : 0;
  // 트랙 없음 → 트랙 AL비용 차감 (현재 옵션에 없지만 대비)
  const trackDeduct = 0;

  // 6. 최종 견적가
  // 자재+인건비에 마진 적용 → 판넬비 + 쪽문(이미 소매가) 별도 합산
  const marginApplied = Math.ceil((materialCost + labor) / (1 - RETAIL_MARGIN) / 1000) * 1000;
  const retailPrice = Math.ceil((marginApplied + panelCost + al.sideDoorCost - finishDeduct - trackDeduct) / 1000) * 1000;

  return {
    // 입력 요약
    doorSize: `${input.widthMm} × ${input.heightMm}`,
    // 원가 상세
    hardwareCost: al.hardwareCost,
    alCost: al.alTotal,
    alDetail: al.alDetail,
    panelCost,
    panelHwebe: hwebe.hwebe,
    panelSheets: hwebe.sheets,
    sideDoorCost: al.sideDoorCost,
    laborCost: labor,
    // 마진 계산
    materialCost,           // 자재원가 (판넬 제외)
    marginApplied,          // 마진 적용가
    finishDeduct,           // 마감 차감
    trackDeduct,            // 트랙 차감
    // 최종
    totalCost: materialCost + panelCost + labor,
    retailPrice,
    // 참고
    areaSqM: al.areaSqM,
    bars: al.bars,
  };
}
