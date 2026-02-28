export const RETAIL_MULTIPLIER = 1.5;

export const COLOR_DETAILS: Record<string, { label: string; subColors?: string[]; hex: string }> = {
  "아이보리": { label: "아이보리", hex: "#F5F0E1" },
  "청색": { label: "청색", hex: "#1E5FA6" },
  "기성단색": { label: "기성단색", subColors: ["청색", "은회색", "백색", "군청색"], hex: "#607D8B" },
  "특이단색": { label: "특이단색", subColors: ["진회색", "티타늄실버"], hex: "#424242" },
  "프린트": { label: "프린트", subColors: ["징크블랙", "리얼징크", "유니스톤"], hex: "#2C2C2C" },
  "아연1.0T": { label: "아연 1.0T", hex: "#B0BEC5" },
  "아연1.2T": { label: "아연 1.2T", hex: "#90A4AE" },
  "스틸1.0T": { label: "스틸 1.0T", hex: "#546E7A" },
};

export interface ProductSize {
  label: string;
  wholesale: Record<string, number>;
}

export interface FlashingProduct {
  id: string;
  name: string;
  desc: string;
  category: string;
  image: string;
  sizes: ProductSize[];
  availableColors: string[];
  note?: string;
}

export const FLASHING_PRODUCTS: FlashingProduct[] = [
  // ─── 벽체마감 ───
  {
    id: "yuba", name: "유바", desc: "판넬 하부 마감 / 벽체 하단 빗물 차단",
    category: "벽체마감", image: "/products/yuba.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트", "아연1.0T", "스틸1.0T"],
    sizes: [
      { label: "50T", wholesale: { "아이보리": 2000, "기성단색": 2400, "특이단색": 2600, "프린트": 4400, "아연1.0T": 5200, "스틸1.0T": 6100 } },
      { label: "75T", wholesale: { "아이보리": 2300, "기성단색": 2800, "특이단색": 3000, "프린트": 5060, "아연1.0T": 6200, "스틸1.0T": 7400 } },
      { label: "100T", wholesale: { "아이보리": 2900, "기성단색": 3500, "특이단색": 3800, "프린트": 6380, "아연1.0T": 7300, "스틸1.0T": 8600 } },
      { label: "125T", wholesale: { "아이보리": 3600, "기성단색": 4400, "특이단색": 4700, "프린트": 7920, "아연1.0T": 8300, "스틸1.0T": 9600 } },
      { label: "150T", wholesale: { "아이보리": 4100, "기성단색": 5000, "특이단색": 5400, "프린트": 9020, "아연1.0T": 9300, "스틸1.0T": 11000 } },
    ],
  },
  {
    id: "elba_ext", name: "외부앵글(엘바)", desc: "벽체 외부 모서리 마감 / 색상면이 바깥쪽",
    category: "벽체마감", image: "/products/elba_ext.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트", "아연1.0T", "스틸1.0T"],
    sizes: [
      { label: "40×40", wholesale: { "아이보리": 1300, "기성단색": 1600, "특이단색": 1700, "프린트": 2860, "아연1.0T": 3400, "스틸1.0T": 4400 } },
      { label: "75×75", wholesale: { "아이보리": 3000, "기성단색": 3600, "특이단색": 3900, "프린트": 6600, "아연1.0T": 6300, "스틸1.0T": 8300 } },
      { label: "100×100", wholesale: { "아이보리": 4000, "기성단색": 4800, "특이단색": 5200, "프린트": 8800, "아연1.0T": 8400, "스틸1.0T": 11000 } },
      { label: "125×125", wholesale: { "아이보리": 4700, "기성단색": 5700, "특이단색": 6200, "프린트": 10340, "아연1.0T": 10500, "스틸1.0T": 13800 } },
      { label: "150×150", wholesale: { "아이보리": 5500, "기성단색": 6600, "특이단색": 7200, "프린트": 12100, "아연1.0T": 12600, "스틸1.0T": 16500 } },
    ],
  },
  {
    id: "elba_int", name: "내부앵글(엘바)", desc: "벽체 내부 모서리 마감 / 색상면이 안쪽",
    category: "벽체마감", image: "/products/elba_int.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트", "아연1.0T", "스틸1.0T"],
    sizes: [
      { label: "40×40", wholesale: { "아이보리": 1300, "기성단색": 1600, "특이단색": 1700, "프린트": 2860, "아연1.0T": 3400, "스틸1.0T": 4400 } },
      { label: "75×75", wholesale: { "아이보리": 3000, "기성단색": 3600, "특이단색": 3900, "프린트": 6600, "아연1.0T": 6300, "스틸1.0T": 8300 } },
      { label: "100×100", wholesale: { "아이보리": 4000, "기성단색": 4800, "특이단색": 5200, "프린트": 8800, "아연1.0T": 8400, "스틸1.0T": 11000 } },
      { label: "125×125", wholesale: { "아이보리": 4700, "기성단색": 5700, "특이단색": 6200, "프린트": 10340, "아연1.0T": 10500, "스틸1.0T": 13800 } },
      { label: "150×150", wholesale: { "아이보리": 5500, "기성단색": 6600, "특이단색": 7200, "프린트": 12100, "아연1.0T": 12600, "스틸1.0T": 16500 } },
    ],
  },
  {
    id: "corner", name: "코너바", desc: "외부 모서리 코너 마감재",
    category: "벽체마감", image: "/products/corner.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "75×75", wholesale: { "아이보리": 5000, "기성단색": 6000, "특이단색": 6500, "프린트": 11000 } },
      { label: "100×100", wholesale: { "아이보리": 5200, "기성단색": 6300, "특이단색": 6800, "프린트": 11440 } },
      { label: "125×125", wholesale: { "아이보리": 6000, "기성단색": 7200, "특이단색": 7800, "프린트": 13200 } },
      { label: "150×150", wholesale: { "아이보리": 7000, "기성단색": 8400, "특이단색": 9100, "프린트": 15400 } },
    ],
  },
  {
    id: "joint", name: "쪼인트바", desc: "판넬 이음새 연결 마감",
    category: "벽체마감", image: "/products/joint.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "W180", wholesale: { "아이보리": 3500, "기성단색": 4200, "특이단색": 4600, "프린트": 7700 } },
    ],
  },
  {
    id: "mulggungi", name: "물끈기", desc: "빗물 흘림 방지 / 벽체 중간 마감",
    category: "벽체마감", image: "/products/mulggungi.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "50×150", wholesale: { "아이보리": 4000, "기성단색": 4800, "특이단색": 5200, "프린트": 8800 } },
    ],
  },
  {
    id: "chair", name: "의자베이스", desc: "의자 골격 / 베이스 보강용",
    category: "벽체마감", image: "/products/chair.jpg",
    availableColors: ["아연1.0T"],
    note: "아연 전용 (색상 없음)",
    sizes: [
      { label: "50T", wholesale: { "아연1.0T": 5400 } },
      { label: "75T", wholesale: { "아연1.0T": 6400 } },
      { label: "100T", wholesale: { "아연1.0T": 7500 } },
    ],
  },
  // ─── 지붕마감 ───
  {
    id: "shingle_ext", name: "슁글용마루(외부)", desc: "슁글 지붕 용마루 마감 / 색상면이 바깥쪽",
    category: "지붕마감", image: "/products/shingle_ext.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "150×150", wholesale: { "아이보리": 5500, "기성단색": 6600, "특이단색": 7200, "프린트": 12100 } },
      { label: "200×200", wholesale: { "아이보리": 8000, "기성단색": 9600, "특이단색": 10400, "프린트": 17600 } },
    ],
  },
  {
    id: "shingle_int", name: "슁글용마루(내부)", desc: "슁글 지붕 용마루 마감 / 색상면이 안쪽",
    category: "지붕마감", image: "/products/shingle_int.jpg",
    availableColors: ["아이보리", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "150×150", wholesale: { "아이보리": 5500, "기성단색": 6600, "특이단색": 7200, "프린트": 12100 } },
      { label: "200×200", wholesale: { "아이보리": 8000, "기성단색": 9600, "특이단색": 10400, "프린트": 17600 } },
    ],
  },
  {
    id: "yongmaru", name: "용마루(상)", desc: "지붕 꼭대기 상부 마감",
    category: "지붕마감", image: "/products/yongmaru.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "150×150", wholesale: { "청색": 6900, "기성단색": 8300, "특이단색": 9000, "프린트": 15180 } },
      { label: "200×200", wholesale: { "청색": 8400, "기성단색": 10100, "특이단색": 11000, "프린트": 18480 } },
    ],
  },
  {
    id: "buchak", name: "부착물도이", desc: "지붕 부착물 주변 빗물 차단",
    category: "지붕마감", image: "/products/buchak.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "50T", wholesale: { "청색": 7300, "기성단색": 8800, "특이단색": 9500, "프린트": 16060 } },
      { label: "75T", wholesale: { "청색": 7700, "기성단색": 9300, "특이단색": 10100, "프린트": 16940 } },
      { label: "100T", wholesale: { "청색": 8400, "기성단색": 10100, "특이단색": 11000, "프린트": 18480 } },
      { label: "125T", wholesale: { "청색": 8700, "기성단색": 10500, "특이단색": 11400, "프린트": 19140 } },
    ],
  },
  {
    id: "muldoi150", name: "물도이 150용", desc: "빗침대 150mm용 물도이",
    category: "지붕마감", image: "/products/muldoi150.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "100T", wholesale: { "청색": 10500, "기성단색": 12600, "특이단색": 13700, "프린트": 23100 } },
    ],
  },
  {
    id: "muldoi200", name: "물도이 200용", desc: "빗침대 200mm용 물도이",
    category: "지붕마감", image: "/products/muldoi200.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "100T", wholesale: { "청색": 11000, "기성단색": 13200, "특이단색": 14300, "프린트": 24200 } },
      { label: "150T", wholesale: { "청색": 11500, "기성단색": 13800, "특이단색": 15000, "프린트": 25300 } },
      { label: "175T", wholesale: { "청색": 12000, "기성단색": 14400, "특이단색": 15600, "프린트": 26400 } },
      { label: "200T", wholesale: { "청색": 12600, "기성단색": 15200, "특이단색": 16400, "프린트": 27720 } },
    ],
  },
  {
    id: "dolchul", name: "돌출박공", desc: "지붕 박공 돌출부 마감",
    category: "지붕마감", image: "/products/dolchul.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "50T", wholesale: { "청색": 6100, "기성단색": 7400, "특이단색": 8000, "프린트": 13420 } },
      { label: "75T", wholesale: { "청색": 6700, "기성단색": 8100, "특이단색": 8800, "프린트": 14740 } },
      { label: "100T", wholesale: { "청색": 7200, "기성단색": 8700, "특이단색": 9400, "프린트": 15840 } },
      { label: "125T", wholesale: { "청색": 7900, "기성단색": 9500, "특이단색": 10300, "프린트": 17380 } },
    ],
  },
  {
    id: "midolchul", name: "미돌출박공", desc: "지붕 박공 비돌출 마감",
    category: "지붕마감", image: "/products/midolchul.jpg",
    availableColors: ["청색", "기성단색", "특이단색", "프린트"],
    sizes: [
      { label: "125T", wholesale: { "청색": 7200, "기성단색": 8700, "특이단색": 9400, "프린트": 15840 } },
    ],
  },
];

export function getRetailPrice(wholesale: number): number {
  return Math.round((wholesale * RETAIL_MULTIPLIER) / 100) * 100;
}

export function getMinRetailPrice(product: FlashingProduct): number {
  let min = Infinity;
  for (const size of product.sizes) {
    for (const price of Object.values(size.wholesale)) {
      const retail = getRetailPrice(price);
      if (retail < min) min = retail;
    }
  }
  return min;
}

export const FLASHING_CATEGORIES = ["전체", "벽체마감", "지붕마감"];
