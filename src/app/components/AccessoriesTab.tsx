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
  const [qty, setQty] = useState<Record<string, number>>({});

  const handleAdd = (item: AccessoryItem) => {
    const q = qty[item.id] || 1;
    const catMap: Record<string, string> = {
      "빗물받이": "gutter",
      "일반부자재": "accessory",
      "철물": "hardware",
    };
    onAddCart({
      key: `acc-${item.id}-${Date.now()}`,
      productId: item.id,
      productName: item.name,
      size: item.unit,
      color: item.color || "",
      retailPrice: item.sellingPrice,
      qty: q,
      category: catMap[item.category] || "accessory",
    });
    setQty(prev => ({ ...prev, [item.id]: 1 }));
  };

  const CARD: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1px solid #e8e8ed",
    padding: "14px 16px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 10,
  };
  const QTY_INPUT: React.CSSProperties = {
    width: 50, padding: "6px 4px", borderRadius: 8, border: "1px solid #d2d2d7",
    textAlign: "center", fontSize: 14, fontWeight: 700,
  };
  const BTN: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700, background: "#7b5ea7", color: "#fff",
    whiteSpace: "nowrap",
  };

  const renderItem = (item: AccessoryItem) => (
    <div key={item.id} style={CARD}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f" }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>
          {item.color && <span>{item.color} · </span>}
          {item.unit}
          {item.note && <span> · {item.note}</span>}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#7b5ea7", whiteSpace: "nowrap" }}>
        ₩{item.sellingPrice.toLocaleString()}
      </div>
      <input type="number" min={1} value={qty[item.id] || 1}
        onChange={e => setQty(prev => ({ ...prev, [item.id]: Math.max(1, +e.target.value || 1) }))}
        style={QTY_INPUT} />
      <button onClick={() => handleAdd(item)} style={BTN}>담기</button>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", marginBottom: 4 }}>부자재</h2>
      <p style={{ fontSize: 14, color: "#86868b", marginBottom: 16 }}>소모품 · 빗물받이 · 철물류</p>

      {/* 서브탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(["빗물받이", "일반부자재", "철물"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e8e8ed",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: sub === t ? "#7b5ea7" : "#fff",
            color: sub === t ? "#fff" : "#6e6e73",
          }}>{t}</button>
        ))}
      </div>

      {sub === "빗물받이" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#aeaeb2", marginBottom: 4 }}>징크블랙 · 스마트스토어 동일 상품</div>
          {GUTTER_ITEMS.map(renderItem)}
        </div>
      )}

      {sub === "일반부자재" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {GENERAL_ITEMS.map(renderItem)}
        </div>
      )}

      {sub === "철물" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#aeaeb2", marginBottom: 4 }}>봉지 단위 판매</div>
          {HARDWARE_SUBCATEGORIES.map(subcat => (
            <div key={subcat}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86868b", marginBottom: 6, marginTop: subcat === "칼라피스" ? 0 : 14 }}>
                {subcat}
              </div>
              {HARDWARE_ITEMS.filter(i => i.subcategory === subcat).map(renderItem)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
