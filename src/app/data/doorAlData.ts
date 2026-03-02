// ─────────────────────────────────────────
// SY한국판넬 도어 알루미늄 데이터
// 엑셀 도어AL단가표 기반: 원가 → 도매(×1.3) → 소매(×1.2)
// ─────────────────────────────────────────

import { DEFAULT_AL_KG_PRICE } from "@/lib/pricing";

export interface DoorAlItem {
  id: string;
  name: string;
  category: "후레임" | "트랙" | "마감바" | "양개바" | "기타";
  unitWeight: number;  // kg/m (백데이터 L열)
  lengthM: number;     // 바 길이(m)
}

// ─── 도어 알루미늄 품목 (25개) ───
export const DOOR_AL_ITEMS: DoorAlItem[] = [
  // 후레임류 (6.55m)
  { id: "da-frame50", name: "50T후레임", category: "후레임", unitWeight: 0.4827, lengthM: 6.55 },
  { id: "da-frame75", name: "75T후레임", category: "후레임", unitWeight: 0.601, lengthM: 6.55 },
  { id: "da-frame100", name: "100T후레임", category: "후레임", unitWeight: 0.65, lengthM: 6.55 },
  { id: "da-frame125", name: "125T후레임", category: "후레임", unitWeight: 0.7915, lengthM: 6.55 },
  { id: "da-frame150", name: "150T후레임", category: "후레임", unitWeight: 1.0027, lengthM: 6.55 },
  // 트랙류 (6.3m)
  { id: "da-ctrack", name: "C트랙", category: "트랙", unitWeight: 1.4238, lengthM: 6.3 },
  { id: "da-mtrack", name: "M트랙", category: "트랙", unitWeight: 3.962, lengthM: 6.3 },
  // 마감바류 (6.3m)
  { id: "da-finish50", name: "50T마감바", category: "마감바", unitWeight: 0.478, lengthM: 6.3 },
  { id: "da-finish75", name: "75T마감바", category: "마감바", unitWeight: 0.57, lengthM: 6.3 },
  { id: "da-finish100", name: "100T마감바", category: "마감바", unitWeight: 0.624, lengthM: 6.3 },
  { id: "da-finish125", name: "125T마감바", category: "마감바", unitWeight: 0.8374, lengthM: 6.3 },
  { id: "da-finish150", name: "150T마감바", category: "마감바", unitWeight: 0.98, lengthM: 6.3 },
  { id: "da-finish155", name: "155T마감바", category: "마감바", unitWeight: 1.037, lengthM: 6.3 },
  // 양개바류 (6.3m)
  { id: "da-yang50", name: "50T양개바", category: "양개바", unitWeight: 0.54, lengthM: 6.3 },
  { id: "da-yang75", name: "75T양개바", category: "양개바", unitWeight: 0.735, lengthM: 6.3 },
  { id: "da-yang100", name: "100T양개바", category: "양개바", unitWeight: 1.14, lengthM: 6.3 },
  { id: "da-yang125", name: "125T양개바", category: "양개바", unitWeight: 1.28, lengthM: 6.3 },
  { id: "da-yang150", name: "150T양개바", category: "양개바", unitWeight: 2.1, lengthM: 6.3 },
  // 기타 (6.3m)
  { id: "da-handle", name: "손잡이바", category: "기타", unitWeight: 0.7281, lengthM: 6.3 },
  { id: "da-guide", name: "가이드바", category: "기타", unitWeight: 0.539, lengthM: 6.3 },
  { id: "da-fix50", name: "50픽스바", category: "기타", unitWeight: 0.1795, lengthM: 6.3 },
];

// ─── 도어AL 카테고리 순서 ───
export const DOOR_AL_CATEGORIES = ["후레임", "트랙", "마감바", "양개바", "기타"] as const;

// ─── 가격 계산 (엑셀 도어AL단가표 공식) ───
// 원가 = 단중 × alKgPrice × 길이
// 도매 = CEILING(원가 × 1.3, 1000)
// 소매 = CEILING(도매 × 1.2, 1000)
export function calcDoorAlPrice(
  item: DoorAlItem,
  alKgPrice: number = DEFAULT_AL_KG_PRICE,
): { cost: number; wholesale: number; retailPrice: number; weightPerBar: number } {
  const cost = item.unitWeight * alKgPrice * item.lengthM;
  const wholesale = Math.ceil(cost * 1.3 / 1000) * 1000;
  const retailPrice = Math.ceil(wholesale * 1.2 / 1000) * 1000;
  const weightPerBar = item.unitWeight * item.lengthM;
  return {
    cost: Math.round(cost),
    wholesale,
    retailPrice,
    weightPerBar: Math.round(weightPerBar * 100) / 100,
  };
}
