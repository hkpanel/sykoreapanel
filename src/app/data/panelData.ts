// ─────────────────────────────────────────
// SY한국판넬 조립식판넬 (매장항시구비) 데이터
// 현재 50T EPS 소골 아이보리만 판매
// 향후 75T, 100T 추가 예정
// ─────────────────────────────────────────

export interface PanelProduct {
  id: string;
  thickness: string;       // "50T" | "75T" | "100T"
  material: string;        // "EPS"
  profile: string;         // "소골"
  color: string;           // "아이보리"
  lengthMm: number;        // 2000 | 2500 | 3000
  hwebePerSheet: number;   // 훼베수
  pricePerHwebe: number;   // 훼베당 단가
  sellingPrice: number;    // 장당 판매가
  widthMm: number;         // 판넬 유효폭 = 1000mm
}

// ─── 훼베당 단가 (두께별) ───
export const PANEL_HWEBE_PRICES: Record<string, number> = {
  "50T": 11000,
  "75T": 12000,   // 향후 추가
  "100T": 13000,  // 향후 추가
};

// ─── 현재 판매 중인 판넬 ───
export const PANEL_PRODUCTS: PanelProduct[] = [
  {
    id: "panel-50t-2000",
    thickness: "50T", material: "EPS", profile: "소골", color: "아이보리",
    lengthMm: 2000, hwebePerSheet: 2, pricePerHwebe: 11000,
    sellingPrice: 22000, widthMm: 1000,
  },
  {
    id: "panel-50t-2500",
    thickness: "50T", material: "EPS", profile: "소골", color: "아이보리",
    lengthMm: 2500, hwebePerSheet: 2.5, pricePerHwebe: 11000,
    sellingPrice: 27500, widthMm: 1000,
  },
  {
    id: "panel-50t-3000",
    thickness: "50T", material: "EPS", profile: "소골", color: "아이보리",
    lengthMm: 3000, hwebePerSheet: 3, pricePerHwebe: 11000,
    sellingPrice: 33000, widthMm: 1000,
  },
];

// ─── 판넬 적재 계산 (운반비용) ───
// 1톤: 폭 1.5m, 길이 3m, 1행만 가능, 2층 적재
// 5톤: 폭 2.12m, 길이 6.3m, 2행 가능, 2층 적재
export const PANEL_LOADING = {
  "1톤": {
    maxWidthM: 1.5,
    maxLengthM: 3,
    maxRows: 1,
    maxLayers: 2,
    baseCapacityPerLayer: { "50T": 24, "75T": 18, "100T": 12 } as Record<string, number>,
  },
  "5톤": {
    maxWidthM: 2.12,
    maxLengthM: 6.3,
    maxRows: 2,
    maxLayers: 2,
    baseCapacityPerLayer: { "50T": 24, "75T": 18, "100T": 12 } as Record<string, number>,
  },
};

// 판넬 몇 장까지 실을 수 있는지 계산
export function calcPanelLoadCapacity(
  truckType: "1톤" | "5톤",
  thickness: string,
  lengthMm: number,
): number {
  const truck = PANEL_LOADING[truckType];
  const basePerLayer = truck.baseCapacityPerLayer[thickness] ?? 24;

  // 행 수 계산: 트럭 길이 / 판넬 길이(m)
  const panelLengthM = lengthMm / 1000;
  const rows = Math.min(Math.floor(truck.maxLengthM / panelLengthM), truck.maxRows);
  if (rows === 0) return 0; // 판넬이 트럭보다 김

  // 층 수 × 행 수 × 1층 기본 적재량
  return rows * truck.maxLayers * basePerLayer;
}
