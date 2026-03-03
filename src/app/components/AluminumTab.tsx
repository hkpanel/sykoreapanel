"use client";
import { useState, useMemo } from "react";
import { CLEANROOM_AL_ITEMS, CLEANROOM_ACCESSORIES, calcCleanroomAlPrice } from "../data/cleanroomAlData";
import { DOOR_AL_ITEMS, DOOR_AL_CATEGORIES, calcDoorAlPrice } from "../data/doorAlData";

type SubTab = "크린룸" | "도어";

interface CartItemInput {
  key: string; productId: string; productName: string;
  size: string; color: string; retailPrice: number; qty: number;
}

export default function AluminumTab({ alKgPrice, onAddCart }: {
  alKgPrice: number;
  onAddCart: (item: CartItemInput & { category: string }) => void;
}) {
  const [sub, setSub] = useState<SubTab>("크린룸");
  // 수량 상태
  const [crQty, setCrQty] = useState<Record<string, number>>({});
  const [daQty, setDaQty] = useState<Record<string, number>>({});
  const [accQty, setAccQty] = useState<Record<string, number>>({});

  const crPrices = useMemo(() =>
    Object.fromEntries(CLEANROOM_AL_ITEMS.map(item => [item.id, calcCleanroomAlPrice(item, alKgPrice)])),
    [alKgPrice]
  );
  const daPrices = useMemo(() =>
    Object.fromEntries(DOOR_AL_ITEMS.map(item => [item.id, calcDoorAlPrice(item, alKgPrice)])),
    [alKgPrice]
  );

  const handleAddCr = (id: string) => {
    const item = CLEANROOM_AL_ITEMS.find(i => i.id === id);
    const price = crPrices[id];
    const qty = crQty[id] || 1;
    if (!item || !price) return;
    onAddCart({
      key: `cr-al-${id}-${Date.now()}`,
      productId: id,
      productName: item.name,
      size: `${item.lengthM}m / ${price.weightPerBar}kg`,
      color: "",
      retailPrice: price.sellingPrice,
      qty,
      category: "cleanroom-al",
    });
    setCrQty(prev => ({ ...prev, [id]: 1 }));
  };

  const handleAddAcc = (id: string) => {
    const acc = CLEANROOM_ACCESSORIES.find(i => i.id === id);
    const qty = accQty[id] || 1;
    if (!acc) return;
    onAddCart({
      key: `cr-acc-${id}-${Date.now()}`,
      productId: id,
      productName: acc.name,
      size: "",
      color: "",
      retailPrice: acc.price,
      qty,
      category: "cleanroom-al",
    });
    setAccQty(prev => ({ ...prev, [id]: 1 }));
  };

  const handleAddDa = (id: string) => {
    const item = DOOR_AL_ITEMS.find(i => i.id === id);
    const price = daPrices[id];
    const qty = daQty[id] || 1;
    if (!item || !price) return;
    onAddCart({
      key: `da-al-${id}-${Date.now()}`,
      productId: id,
      productName: item.name,
      size: `${item.lengthM}m / ${price.weightPerBar}kg`,
      color: "",
      retailPrice: price.retailPrice,
      qty,
      category: "door-al",
    });
    setDaQty(prev => ({ ...prev, [id]: 1 }));
  };

  const CARD: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e8e8ed",
    padding: "16px 18px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
  };
  const QTY_INPUT: React.CSSProperties = {
    width: 56, padding: "6px 4px", borderRadius: 8, border: "1px solid #d2d2d7",
    textAlign: "center", fontSize: 14, fontWeight: 700,
  };
  const BTN: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", marginBottom: 4 }}>알루미늄</h2>
      <p style={{ fontSize: 14, color: "#86868b", marginBottom: 16 }}>본 단위 판매 · AL kg단가 ₩{alKgPrice.toLocaleString()} 기준</p>

      {/* 서브탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["크린룸", "도어"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e8e8ed",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            background: sub === t ? "#7b5ea7" : "#fff",
            color: sub === t ? "#fff" : "#6e6e73",
          }}>{t} AL</button>
        ))}
      </div>

      {sub === "크린룸" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CLEANROOM_AL_ITEMS.map(item => {
            const p = crPrices[item.id];
            return (
              <div key={item.id} style={CARD}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
                    {item.unitWeight}kg/m · {item.lengthM}m · {p.weightPerBar}kg/본
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
                  ₩{p.sellingPrice.toLocaleString()}
                </div>
                <input type="number" min={1} value={crQty[item.id] || 1}
                  onChange={e => setCrQty(prev => ({ ...prev, [item.id]: Math.max(1, +e.target.value || 1) }))}
                  style={QTY_INPUT} />
                <button onClick={() => handleAddCr(item.id)} style={BTN}>담기</button>
              </div>
            );
          })}
          {/* 코너포인트 */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginTop: 12, marginBottom: 4 }}>부자재</div>
          {CLEANROOM_ACCESSORIES.map(acc => (
            <div key={acc.id} style={CARD}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{acc.name}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#7b5ea7" }}>₩{acc.price.toLocaleString()}</div>
              <input type="number" min={1} value={accQty[acc.id] || 1}
                onChange={e => setAccQty(prev => ({ ...prev, [acc.id]: Math.max(1, +e.target.value || 1) }))}
                style={QTY_INPUT} />
              <button onClick={() => handleAddAcc(acc.id)} style={BTN}>담기</button>
            </div>
          ))}
        </div>
      )}

      {sub === "도어" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DOOR_AL_CATEGORIES.map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginBottom: 6, marginTop: cat === "후레임" ? 0 : 12 }}>
                {cat}
              </div>
              {DOOR_AL_ITEMS.filter(i => i.category === cat).map(item => {
                const p = daPrices[item.id];
                return (
                  <div key={item.id} style={{ ...CARD, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
                        {item.unitWeight}kg/m · {item.lengthM}m · {p.weightPerBar}kg/본
                      </div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
                      ₩{p.retailPrice.toLocaleString()}
                    </div>
                    <input type="number" min={1} value={daQty[item.id] || 1}
                      onChange={e => setDaQty(prev => ({ ...prev, [item.id]: Math.max(1, +e.target.value || 1) }))}
                      style={QTY_INPUT} />
                    <button onClick={() => handleAddDa(item.id)} style={BTN}>담기</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
