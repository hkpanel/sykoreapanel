"use client";
import { useState } from "react";
import { GUTTER_ITEMS, GENERAL_ITEMS, HARDWARE_ITEMS, HARDWARE_SUBCATEGORIES, type AccessoryItem } from "../data/accessoriesData";

type SubTab = "빗물받이" | "일반부자재" | "철물";

interface CartItemInput {
  key: string; productId: string; productName: string;
  size: string; color: string; retailPrice: number; qty: number;
}

export default function AccessoriesTab({ onAddCart }: {
  onAddCart: (item: CartItemInput & { category: string }) => void;
}) {
  const [sub, setSub] = useState<SubTab>("빗물받이");
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});

  const getQtyNum = (val: string | undefined) => {
    const n = parseInt(val || "1", 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };

  const handleAdd = (item: AccessoryItem) => {
    const catMap: Record<string, string> = {
      "빗물받이": "gutter", "일반부자재": "accessory", "철물": "hardware",
    };
    onAddCart({
      key: `acc-${item.id}-${Date.now()}`, productId: item.id, productName: item.name,
      size: item.unit, color: item.color || "",
      retailPrice: item.sellingPrice, qty: getQtyNum(qty[item.id]),
      category: catMap[item.category] || "accessory",
    });
    setQty(prev => ({ ...prev, [item.id]: "1" }));
  };

  const filterItems = (items: AccessoryItem[]) =>
    items.filter(i => !search || i.name.includes(search) || (i.subcategory && i.subcategory.includes(search)));

  const CARD: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1px solid #e8e8ed",
    padding: "14px 16px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 10,
  };
  const QTY: React.CSSProperties = {
    width: 48, padding: "6px 4px", borderRadius: 8, border: "1px solid #d2d2d7",
    textAlign: "center", fontSize: 14, fontWeight: 700,
  };

  const renderItem = (item: AccessoryItem) => (
    <div key={item.id} style={CARD}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="newtab-name" style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
        <div className="newtab-sub" style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
          {item.color && <span>{item.color} · </span>}
          {item.unit}
          {item.note && <span> · {item.note}</span>}
        </div>
      </div>
      <div className="newtab-price" style={{ fontSize: 16, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
        ₩{item.sellingPrice.toLocaleString()}
      </div>
      <input type="number" min={1} value={qty[item.id] ?? "1"}
        onFocus={e => e.target.select()}
        onChange={e => setQty(prev => ({ ...prev, [item.id]: e.target.value }))}
        style={QTY} />
      <button className="newtab-btn" onClick={() => handleAdd(item)}
        style={{ padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff", whiteSpace: "nowrap" }}>담기</button>
    </div>
  );

  const fGutter = filterItems(GUTTER_ITEMS);
  const fGeneral = filterItems(GENERAL_ITEMS);
  const fHardware = filterItems(HARDWARE_ITEMS);

  return (
    <div className="newtab-wrap" style={{ padding: "20px 16px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", marginBottom: 4 }}>부자재</h2>
      <p className="newtab-sub" style={{ fontSize: 14, color: "#86868b", marginBottom: 14 }}>소모품 · 빗물받이 · 철물류</p>

      {/* 검색 */}
      <input className="newtab-search" type="text" placeholder="🔍 제품명 검색 (실리콘, 칼라피스, 엘보...)"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d2d2d7",
          fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }}
      />

      {/* 서브탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["빗물받이", "일반부자재", "철물"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #e8e8ed",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: sub === t ? "#7b5ea7" : "#fff",
            color: sub === t ? "#fff" : "#6e6e73",
          }}>{t}</button>
        ))}
      </div>

      {sub === "빗물받이" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#aeaeb2", marginBottom: 4 }}>징크블랙 · 스마트스토어 동일 상품</div>
          {fGutter.map(renderItem)}
          {fGutter.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aeaeb2", fontSize: 14 }}>검색 결과 없음</div>}
        </div>
      )}

      {sub === "일반부자재" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fGeneral.map(renderItem)}
          {fGeneral.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aeaeb2", fontSize: 14 }}>검색 결과 없음</div>}
        </div>
      )}

      {sub === "철물" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#aeaeb2", marginBottom: 4 }}>봉지 단위 판매</div>
          {HARDWARE_SUBCATEGORIES.map(subcat => {
            const items = fHardware.filter(i => i.subcategory === subcat);
            if (items.length === 0) return null;
            return (
              <div key={subcat}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginBottom: 6, marginTop: subcat === "칼라피스" ? 0 : 14 }}>
                  {subcat}
                </div>
                {items.map(renderItem)}
              </div>
            );
          })}
          {fHardware.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aeaeb2", fontSize: 14 }}>검색 결과 없음</div>}
        </div>
      )}
    </div>
  );
}
