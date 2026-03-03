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
  const [search, setSearch] = useState("");
  const [crQty, setCrQty] = useState<Record<string, string>>({});
  const [daQty, setDaQty] = useState<Record<string, string>>({});
  const [accQty, setAccQty] = useState<Record<string, string>>({});

  const crPrices = useMemo(() =>
    Object.fromEntries(CLEANROOM_AL_ITEMS.map(item => [item.id, calcCleanroomAlPrice(item, alKgPrice)])),
    [alKgPrice]
  );
  const daPrices = useMemo(() =>
    Object.fromEntries(DOOR_AL_ITEMS.map(item => [item.id, calcDoorAlPrice(item, alKgPrice)])),
    [alKgPrice]
  );

  const filteredCr = CLEANROOM_AL_ITEMS.filter(i => !search || i.name.includes(search));
  const filteredAcc = CLEANROOM_ACCESSORIES.filter(i => !search || i.name.includes(search));
  const filteredDa = DOOR_AL_ITEMS.filter(i => !search || i.name.includes(search) || i.category.includes(search));

  const getQtyNum = (val: string | undefined) => {
    const n = parseInt(val || "1", 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };

  const handleAddCr = (id: string) => {
    const item = CLEANROOM_AL_ITEMS.find(i => i.id === id);
    const price = crPrices[id];
    if (!item || !price) return;
    onAddCart({
      key: `cr-al-${id}-${Date.now()}`, productId: id, productName: item.name,
      size: `${item.lengthM}m / ${price.weightPerBar}kg`, color: "",
      retailPrice: price.sellingPrice, qty: getQtyNum(crQty[id]), category: "cleanroom-al",
    });
    setCrQty(prev => ({ ...prev, [id]: "1" }));
  };

  const handleAddAcc = (id: string) => {
    const acc = CLEANROOM_ACCESSORIES.find(i => i.id === id);
    if (!acc) return;
    onAddCart({
      key: `cr-acc-${id}-${Date.now()}`, productId: id, productName: acc.name,
      size: "", color: "", retailPrice: acc.price, qty: getQtyNum(accQty[id]), category: "cleanroom-al",
    });
    setAccQty(prev => ({ ...prev, [id]: "1" }));
  };

  const handleAddDa = (id: string) => {
    const item = DOOR_AL_ITEMS.find(i => i.id === id);
    const price = daPrices[id];
    if (!item || !price) return;
    onAddCart({
      key: `da-al-${id}-${Date.now()}`, productId: id, productName: item.name,
      size: `${item.lengthM}m / ${price.weightPerBar}kg`, color: "",
      retailPrice: price.retailPrice, qty: getQtyNum(daQty[id]), category: "door-al",
    });
    setDaQty(prev => ({ ...prev, [id]: "1" }));
  };

  const CARD: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1px solid #e8e8ed",
    padding: "14px 16px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 10,
  };
  const QTY: React.CSSProperties = {
    width: 48, padding: "6px 4px", borderRadius: 8, border: "1px solid #d2d2d7",
    textAlign: "center", fontSize: 14, fontWeight: 700,
  };

  return (
    <div className="newtab-wrap" style={{ padding: "20px 16px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", marginBottom: 14 }}>알루미늄</h2>

      {/* 검색 */}
      <input className="newtab-search" type="text" placeholder="🔍 제품명 검색 (유바, 앵글, 후레임...)"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d2d2d7",
          fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }}
      />

      {/* 서브탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {(["크린룸", "도어"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #e8e8ed",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            background: sub === t ? "#7b5ea7" : "#fff",
            color: sub === t ? "#fff" : "#6e6e73",
          }}>{t} AL</button>
        ))}
      </div>

      {sub === "크린룸" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredCr.map(item => {
            const p = crPrices[item.id];
            return (
              <div key={item.id} style={CARD}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="newtab-name" style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
                  <div className="newtab-sub" style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
                    {item.unitWeight}kg/m · {item.lengthM}m · {p.weightPerBar}kg/본
                  </div>
                </div>
                <div className="newtab-price" style={{ fontSize: 16, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
                  ₩{p.sellingPrice.toLocaleString()}
                </div>
                <input type="number" min={1} value={crQty[item.id] ?? "1"}
                  onFocus={e => e.target.select()}
                  onChange={e => setCrQty(prev => ({ ...prev, [item.id]: e.target.value }))}
                  style={QTY} />
                <button className="newtab-btn" onClick={() => handleAddCr(item.id)}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff", whiteSpace: "nowrap" }}>담기</button>
              </div>
            );
          })}
          {filteredAcc.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginTop: 10, marginBottom: 2 }}>부자재</div>
              {filteredAcc.map(acc => (
                <div key={acc.id} style={CARD}>
                  <div style={{ flex: 1 }}>
                    <div className="newtab-name" style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{acc.name}</div>
                  </div>
                  <div className="newtab-price" style={{ fontSize: 16, fontWeight: 800, color: "#7b5ea7" }}>₩{acc.price.toLocaleString()}</div>
                  <input type="number" min={1} value={accQty[acc.id] ?? "1"}
                    onFocus={e => e.target.select()}
                    onChange={e => setAccQty(prev => ({ ...prev, [acc.id]: e.target.value }))}
                    style={QTY} />
                  <button className="newtab-btn" onClick={() => handleAddAcc(acc.id)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff", whiteSpace: "nowrap" }}>담기</button>
                </div>
              ))}
            </>
          )}
          {filteredCr.length === 0 && filteredAcc.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#aeaeb2", fontSize: 14 }}>검색 결과 없음</div>
          )}
        </div>
      )}

      {sub === "도어" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DOOR_AL_CATEGORIES.map(cat => {
            const items = filteredDa.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginBottom: 6, marginTop: cat === "후레임" ? 0 : 12 }}>
                  {cat}
                </div>
                {items.map(item => {
                  const p = daPrices[item.id];
                  return (
                    <div key={item.id} style={{ ...CARD, marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="newtab-name" style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
                        <div className="newtab-sub" style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
                          {item.unitWeight}kg/m · {item.lengthM}m · {p.weightPerBar}kg/본
                        </div>
                      </div>
                      <div className="newtab-price" style={{ fontSize: 16, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
                        ₩{p.retailPrice.toLocaleString()}
                      </div>
                      <input type="number" min={1} value={daQty[item.id] ?? "1"}
                        onFocus={e => e.target.select()}
                        onChange={e => setDaQty(prev => ({ ...prev, [item.id]: e.target.value }))}
                        style={QTY} />
                      <button className="newtab-btn" onClick={() => handleAddDa(item.id)}
                        style={{ padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                          fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff", whiteSpace: "nowrap" }}>담기</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filteredDa.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#aeaeb2", fontSize: 14 }}>검색 결과 없음</div>
          )}
        </div>
      )}
    </div>
  );
}
