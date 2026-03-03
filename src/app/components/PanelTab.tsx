"use client";
import { useState } from "react";
import { PANEL_PRODUCTS } from "../data/panelData";

interface CartItemInput {
  key: string; productId: string; productName: string;
  size: string; color: string; retailPrice: number; qty: number;
}

export default function PanelTab({ onAddCart }: {
  onAddCart: (item: CartItemInput & { category: string }) => void;
}) {
  const [qty, setQty] = useState<Record<string, string>>({});

  const getQtyNum = (val: string | undefined) => {
    const n = parseInt(val || "1", 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };

  const handleAdd = (id: string) => {
    const product = PANEL_PRODUCTS.find(p => p.id === id);
    if (!product) return;
    onAddCart({
      key: `panel-${id}-${Date.now()}`,
      productId: id,
      productName: `조립식판넬 ${product.thickness}`,
      size: `${product.lengthMm}mm × 1000mm · ${product.profile}`,
      color: product.color,
      retailPrice: product.sellingPrice,
      qty: getQtyNum(qty[id]),
      category: "panel",
    });
    setQty(prev => ({ ...prev, [id]: "1" }));
  };

  const CARD: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e8e8ed",
    padding: 20, display: "flex", flexDirection: "column", gap: 12,
  };
  const QTY: React.CSSProperties = {
    width: 48, padding: "6px 4px", borderRadius: 8, border: "1px solid #d2d2d7",
    textAlign: "center", fontSize: 14, fontWeight: 700,
  };
  const BTN: React.CSSProperties = {
    padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 700, background: "#7b5ea7", color: "#fff",
  };

  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", marginBottom: 4 }}>조립식판넬</h2>
      <p style={{ fontSize: 14, color: "#86868b", marginBottom: 20 }}>
        매장 항시 구비 · EPS 소골 아이보리 · 장당 판매
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PANEL_PRODUCTS.map(product => (
          <div key={product.id} style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1d1d1f" }}>
                  {product.lengthMm}mm
                </div>
                <div style={{ fontSize: 13, color: "#86868b", marginTop: 4 }}>
                  {product.thickness} · {product.material} · {product.profile} · {product.color}
                </div>
                <div style={{ fontSize: 12, color: "#aeaeb2", marginTop: 2 }}>
                  {product.hwebePerSheet}훼베 × ₩{product.pricePerHwebe.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#7b5ea7" }}>
                ₩{product.sellingPrice.toLocaleString()}
                <span style={{ fontSize: 12, color: "#86868b", fontWeight: 600 }}>/장</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
              <input type="number" min={1} value={qty[product.id] ?? "1"}
                onFocus={e => e.target.select()}
                onChange={e => setQty(prev => ({ ...prev, [product.id]: e.target.value }))}
                style={QTY} />
              <span style={{ fontSize: 12, color: "#86868b" }}>장</span>
              <button onClick={() => handleAdd(product.id)} style={BTN}>담기</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: "#f5f5f7", borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6e6e73", marginBottom: 6 }}>안내사항</div>
        <div style={{ fontSize: 12, color: "#86868b", lineHeight: 1.6 }}>
          • 판넬은 택배 발송이 불가하며 용차(1톤/5톤)로만 배송됩니다.<br/>
          • 75T, 100T 판넬은 준비 중입니다.<br/>
          • 대량 주문 시 카카오톡으로 문의해주세요.
        </div>
      </div>
    </div>
  );
}
