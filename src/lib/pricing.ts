// ─────────────────────────────────────────
// SY한국판넬 가격 설정 중앙 관리
// Firestore settings/pricing 문서에서 읽기/쓰기
// ─────────────────────────────────────────

import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// 기본값
export const DEFAULT_AL_KG_PRICE = 7700;
export const DEFAULT_RETAIL_MULTIPLIER = 1.3;

// 가격 오버라이드 타입: { [productId]: { [sizeLabel]: { [color]: number } } }
export type PriceOverrides = Record<string, Record<string, Record<string, number>>>;

export interface PricingSettings {
  alKgPrice: number;
  retailMultiplier: number;
  flashingPrices: PriceOverrides;
}

const PRICING_DOC = doc(db, "settings", "pricing");
const FLASHING_PRICES_DOC = doc(db, "settings", "flashingPrices");

// ─── React 훅: 실시간 가격 설정 구독 ───
export function usePricingSettings(): PricingSettings & { loading: boolean } {
  const [settings, setSettings] = useState<PricingSettings>({
    alKgPrice: DEFAULT_AL_KG_PRICE,
    retailMultiplier: DEFAULT_RETAIL_MULTIPLIER,
    flashingPrices: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = onSnapshot(PRICING_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(prev => ({
          ...prev,
          alKgPrice: data.alKgPrice ?? DEFAULT_AL_KG_PRICE,
          retailMultiplier: data.retailMultiplier ?? DEFAULT_RETAIL_MULTIPLIER,
        }));
      }
      setLoading(false);
    }, (err) => {
      console.error("가격 설정 로드 실패:", err);
      setLoading(false);
    });
    const unsub2 = onSnapshot(FLASHING_PRICES_DOC, (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ ...prev, flashingPrices: snap.data() as PriceOverrides }));
      }
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  return { ...settings, loading };
}

// ─── 1회성 로드 (비-React 환경용) ───
export async function loadPricingSettings(): Promise<PricingSettings> {
  try {
    const snap = await getDoc(PRICING_DOC);
    if (snap.exists()) {
      const data = snap.data();
      return {
        alKgPrice: data.alKgPrice ?? DEFAULT_AL_KG_PRICE,
        retailMultiplier: data.retailMultiplier ?? DEFAULT_RETAIL_MULTIPLIER,
        flashingPrices: {},
      };
    }
  } catch (err) {
    console.error("가격 설정 로드 실패:", err);
  }
  return { alKgPrice: DEFAULT_AL_KG_PRICE, retailMultiplier: DEFAULT_RETAIL_MULTIPLIER, flashingPrices: {} };
}

// ─── 알루미늄 kg당 단가 저장 ───
export async function saveAlKgPrice(price: number): Promise<void> {
  await setDoc(PRICING_DOC, { alKgPrice: price }, { merge: true });
}

// ─── 후레싱 마진 배수 저장 ───
export async function saveRetailMultiplier(multiplier: number): Promise<void> {
  await setDoc(PRICING_DOC, { retailMultiplier: multiplier }, { merge: true });
}
