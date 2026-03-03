// ─────────────────────────────────────────
// SY한국판넬 크린룸 알루미늄 데이터
// 판매가 = 단중 × alKgPrice × 길이 × 1.5
// ─────────────────────────────────────────

import { DEFAULT_AL_KG_PRICE } from "@/lib/pricing";

export interface CleanroomAlItem {
  id: string;
  name: string;
  unitWeight: number;  // kg/m
  lengthM: number;     // 바 길이(m)
  unit: string;        // "본" | "개"
}

// ─── 크린룸 알루미늄 품목 (16개) ───
export const CLEANROOM_AL_ITEMS: CleanroomAlItem[] = [
  { id: "cr-yuba50", name: "50T A/L 유바", unitWeight: 0.342, lengthM: 6.2, unit: "본" },
  { id: "cr-yuba75", name: "75T A/L 유바", unitWeight: 0.49, lengthM: 6.2, unit: "본" },
  { id: "cr-yuba100", name: "100T A/L 유바", unitWeight: 0.52, lengthM: 6.2, unit: "본" },
  { id: "cr-yangnal", name: "양날베이스", unitWeight: 0.699, lengthM: 6.2, unit: "본" },
  { id: "cr-yangnal-high", name: "높은양날베이스", unitWeight: 1.48, lengthM: 6.2, unit: "본" },
  { id: "cr-angle38x38", name: "A/L 앵글 38×38", unitWeight: 0.201, lengthM: 6.2, unit: "본" },
  { id: "cr-angle38x20", name: "A/L 앵글 38×20", unitWeight: 0.184, lengthM: 6.2, unit: "본" },
  { id: "cr-angle70x38", name: "A/L 앵글 70×38", unitWeight: 0.568, lengthM: 6.2, unit: "본" },
  { id: "cr-oenal", name: "외날베이스", unitWeight: 0.555, lengthM: 6.2, unit: "본" },
  { id: "cr-ban", name: "반베이스", unitWeight: 0.359, lengthM: 6.2, unit: "본" },
  { id: "cr-round", name: "라운드몰드", unitWeight: 0.289, lengthM: 6.2, unit: "본" },
  { id: "cr-jmold", name: "J 몰드", unitWeight: 0.548, lengthM: 6.2, unit: "본" },
  { id: "cr-tbar", name: "T 바", unitWeight: 0.731, lengthM: 6.2, unit: "본" },
  { id: "cr-hbar", name: "H 바", unitWeight: 0.723, lengthM: 6.2, unit: "본" },
  { id: "cr-38x38-15t", name: "38×38 1.5T", unitWeight: 0.299, lengthM: 6.2, unit: "본" },
  { id: "cr-120x60-tbar", name: "120×60 T바", unitWeight: 0.904, lengthM: 6.2, unit: "본" },
];

// ─── 크린룸 부자재 (코너포인트) ───
export const CLEANROOM_ACCESSORIES = [
  { id: "cr-corner-s", name: "코너포인트 (小)", price: 1500, unit: "개" },
  { id: "cr-corner-l", name: "코너포인트 (大)", price: 2000, unit: "개" },
];

// ─── 가격 계산 ───
export const CLEANROOM_AL_MARGIN = 1.5;

export function calcCleanroomAlPrice(
  item: CleanroomAlItem,
  alKgPrice: number = DEFAULT_AL_KG_PRICE,
): { cost: number; sellingPrice: number; weightPerBar: number } {
  const cost = item.unitWeight * alKgPrice * item.lengthM;
  const sellingPrice = Math.ceil(cost * CLEANROOM_AL_MARGIN / 100) * 100;
  const weightPerBar = item.unitWeight * item.lengthM;
  return { cost: Math.round(cost), sellingPrice, weightPerBar: Math.round(weightPerBar * 100) / 100 };
}
