// ─────────────────────────────────────────
// SY한국판넬 부자재 데이터
// 빗물받이시스템 + 일반부자재 + 철물
// ─────────────────────────────────────────

export interface AccessoryItem {
  id: string;
  name: string;
  category: "빗물받이" | "일반부자재" | "철물";
  subcategory?: string;        // 철물 세부 분류
  sellingPrice: number;        // 판매가
  unit: string;                // "EA" | "3M" | "봉(500개)" 등
  color?: string;              // 색상
  colors?: string[];           // 선택 가능한 색상 목록
  note?: string;               // 비고
  isLongItem?: boolean;        // 3M 이상 장척물 (택배 불가 판정용)
  // 철물용 추가 필드
  costPerUnit?: number;        // 개당 매입가 (마진 계산용)
  qtyPerBundle?: number;       // 봉지당 수량
}

// ─── 빗물받이시스템 (징크블랙, 8품목) ───
export const GUTTER_ITEMS: AccessoryItem[] = [
  { id: "gut-yudo", name: "유도모임통", category: "빗물받이", sellingPrice: 7000, unit: "EA", color: "징크블랙" },
  { id: "gut-sagak", name: "사각모임통", category: "빗물받이", sellingPrice: 8000, unit: "EA", color: "징크블랙" },
  { id: "gut-maguri", name: "마구리 옆마개 (좌/우)", category: "빗물받이", sellingPrice: 2000, unit: "세트", color: "징크블랙" },
  { id: "gut-elbow", name: "엘보", category: "빗물받이", sellingPrice: 3000, unit: "EA", color: "징크블랙" },
  { id: "gut-bando", name: "반도 (스까미)", category: "빗물받이", sellingPrice: 700, unit: "EA", color: "징크블랙" },
  { id: "gut-hook", name: "물받이 걸이쇠", category: "빗물받이", sellingPrice: 900, unit: "EA", color: "징크블랙" },
  { id: "gut-homtong", name: "선홈통 (3M)", category: "빗물받이", sellingPrice: 12500, unit: "3M", color: "징크블랙", isLongItem: true },
  { id: "gut-muldong", name: "물동이 (3M)", category: "빗물받이", sellingPrice: 12500, unit: "3M", color: "징크블랙", isLongItem: true },
];

// ─── 일반부자재 ───
export const GENERAL_ITEMS: AccessoryItem[] = [
  { id: "gen-silicone-ivory", name: "실리콘 (아이보리)", category: "일반부자재", sellingPrice: 2000, unit: "EA" },
  { id: "gen-silicone-clear", name: "실리콘 (투명)", category: "일반부자재", sellingPrice: 2500, unit: "EA" },
  { id: "gen-cap-round", name: "원형캡", category: "일반부자재", sellingPrice: 13000, unit: "EA", colors: ["아이보리", "은회색"] },
  { id: "gen-cap-roof", name: "지붕캡", category: "일반부자재", sellingPrice: 14000, unit: "EA", colors: ["청색", "검정", "은회색"] },
  { id: "gen-crosha", name: "크로샤 1M", category: "일반부자재", sellingPrice: 1000, unit: "EA", color: "청색" },
  // 앤드캡 4골
  { id: "gen-endcap4-50", name: "앤드캡 4골 50T", category: "일반부자재", sellingPrice: 3000, unit: "EA", color: "청색" },
  { id: "gen-endcap4-75", name: "앤드캡 4골 75T", category: "일반부자재", sellingPrice: 3500, unit: "EA", color: "청색" },
  { id: "gen-endcap4-100", name: "앤드캡 4골 100T", category: "일반부자재", sellingPrice: 4000, unit: "EA", color: "청색" },
  // 앤드캡 3골 (+1000원)
  { id: "gen-endcap3-50", name: "앤드캡 3골 50T", category: "일반부자재", sellingPrice: 4000, unit: "EA", color: "청색" },
  { id: "gen-endcap3-75", name: "앤드캡 3골 75T", category: "일반부자재", sellingPrice: 4500, unit: "EA", color: "청색" },
  { id: "gen-endcap3-100", name: "앤드캡 3골 100T", category: "일반부자재", sellingPrice: 5000, unit: "EA", color: "청색" },
];

// ─── 철물 (엑셀 '철물' 탭, 봉지 단위 판매, 마진 50%) ───
// 판매가 = CEIL(봉지매입가 × 1.5, 100)
export const HARDWARE_ITEMS: AccessoryItem[] = [
  // 칼라피스 (500개/봉)
  { id: "hw-cala-ivory", name: "칼라피스 아이보리", category: "철물", subcategory: "칼라피스", sellingPrice: 9400, unit: "봉(500개)", costPerUnit: 12.5, qtyPerBundle: 500 },
  { id: "hw-cala-black", name: "칼라피스 흑색", category: "철물", subcategory: "칼라피스", sellingPrice: 9400, unit: "봉(500개)", costPerUnit: 12.5, qtyPerBundle: 500 },
  { id: "hw-cala-silver", name: "칼라피스 은회색", category: "철물", subcategory: "칼라피스", sellingPrice: 9400, unit: "봉(500개)", costPerUnit: 12.5, qtyPerBundle: 500 },
  { id: "hw-cala-blue", name: "칼라피스 청색", category: "철물", subcategory: "칼라피스", sellingPrice: 9400, unit: "봉(500개)", costPerUnit: 12.5, qtyPerBundle: 500 },
  { id: "hw-cala-darkgray", name: "칼라피스 진회색", category: "철물", subcategory: "칼라피스", sellingPrice: 9400, unit: "봉(500개)", costPerUnit: 12.5, qtyPerBundle: 500 },
  // 직결피스
  { id: "hw-jik-816", name: "직결피스 8×16", category: "철물", subcategory: "직결피스", sellingPrice: 11100, unit: "봉(1000개)", costPerUnit: 7.4, qtyPerBundle: 1000 },
  { id: "hw-jik-820", name: "직결피스 8×20", category: "철물", subcategory: "직결피스", sellingPrice: 12000, unit: "봉(1000개)", costPerUnit: 8.0, qtyPerBundle: 1000 },
  { id: "hw-jik-825", name: "직결피스 8×25", category: "철물", subcategory: "직결피스", sellingPrice: 7200, unit: "봉(500개)", costPerUnit: 9.6, qtyPerBundle: 500 },
  { id: "hw-jik-832", name: "직결피스 8×32", category: "철물", subcategory: "직결피스", sellingPrice: 8700, unit: "봉(500개)", costPerUnit: 11.5, qtyPerBundle: 500 },
  // 스크류볼트 (100개/봉)
  { id: "hw-screw-1480", name: "스크류볼트 14×80", category: "철물", subcategory: "스크류볼트", sellingPrice: 9500, unit: "봉(100개)", costPerUnit: 63, qtyPerBundle: 100 },
  { id: "hw-screw-14100", name: "스크류볼트 14×100", category: "철물", subcategory: "스크류볼트", sellingPrice: 12300, unit: "봉(100개)", costPerUnit: 82, qtyPerBundle: 100 },
  { id: "hw-screw-14130", name: "스크류볼트 14×130", category: "철물", subcategory: "스크류볼트", sellingPrice: 17300, unit: "봉(100개)", costPerUnit: 115, qtyPerBundle: 100 },
  { id: "hw-screw-14150", name: "스크류볼트 14×150", category: "철물", subcategory: "스크류볼트", sellingPrice: 21000, unit: "봉(100개)", costPerUnit: 140, qtyPerBundle: 100 },
  { id: "hw-screw-14180", name: "스크류볼트 14×180", category: "철물", subcategory: "스크류볼트", sellingPrice: 27800, unit: "봉(100개)", costPerUnit: 185, qtyPerBundle: 100 },
  // 방수피스 (200개/봉)
  { id: "hw-waterproof-1020", name: "방수피스 10×20", category: "철물", subcategory: "방수피스", sellingPrice: 12900, unit: "봉(200개)", costPerUnit: 43, qtyPerBundle: 200 },
  { id: "hw-waterproof-1025", name: "방수피스 10×25", category: "철물", subcategory: "방수피스", sellingPrice: 14100, unit: "봉(200개)", costPerUnit: 47, qtyPerBundle: 200 },
  // 칼블럭 (100개/봉)
  { id: "hw-calblock-612", name: "칼블럭 6×12", category: "철물", subcategory: "칼블럭", sellingPrice: 4800, unit: "봉(100개)", costPerUnit: 32, qtyPerBundle: 100 },
  { id: "hw-calblock-625", name: "칼블럭 6×25", category: "철물", subcategory: "칼블럭", sellingPrice: 5100, unit: "봉(100개)", costPerUnit: 34, qtyPerBundle: 100 },
];

// ─── 전체 부자재 합치기 ───
export const ALL_ACCESSORIES: AccessoryItem[] = [
  ...GUTTER_ITEMS,
  ...GENERAL_ITEMS,
  ...HARDWARE_ITEMS,
];

// ─── 카테고리별 조회 ───
export function getAccessoriesByCategory(category: AccessoryItem["category"]): AccessoryItem[] {
  return ALL_ACCESSORIES.filter(item => item.category === category);
}

// ─── 철물 서브카테고리 목록 ───
export const HARDWARE_SUBCATEGORIES = ["칼라피스", "직결피스", "스크류볼트", "방수피스", "칼블럭"] as const;
