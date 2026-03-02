"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { onAuthChange, signOut } from "@/lib/auth";
import {
  subscribeCart, setCartItem, removeCartItem, clearCart,
  subscribeAddresses, migrateLocalData, saveOrder,
  type CartItem, type Order,
} from "@/lib/db";
import AuthModal from "./components/AuthModal";
import MyPageModal from "./components/MyPageModal";
import {
  FLASHING_PRODUCTS, FLASHING_CATEGORIES, COLOR_DETAILS,
  getRetailPrice, getMinRetailPrice,
  type FlashingProduct,
} from "./data/flashingProducts";
import HangaDoorEstimator from "./components/HangaDoorEstimator";
import SwingDoorEstimator from "./components/SwingDoorEstimator";
import { TRUCK_FEES, calcTruckOptions } from "./data/truckFees";
import {
  isMetaMaskInstalled, connectWallet, switchToBSC, getWalletInfo,
  getSycPrice, krwToSyc, sendSycPayment,
  type WalletInfo, type SycPrice,
} from "@/lib/syc-payment";

// PortOne V2 SDK 글로벌 타입
declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: {
        storeId: string;
        channelKey: string;
        paymentId: string;
        orderName: string;
        totalAmount: number;
        currency: string;
        payMethod: string;
        customer?: { fullName?: string; phoneNumber?: string; email?: string };
      }) => Promise<{ code?: string; message?: string; txId?: string; paymentId?: string }>;
    };
  }
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let n = 0; const step = value / 75;
    const t = setInterval(() => { n += step; if (n >= value) { setD(value); clearInterval(t); } else setD(Math.floor(n)); }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{d.toLocaleString()}{suffix}</span>;
}

function ProductCard({ product, onClick }: { product: FlashingProduct; onClick: () => void }) {
  const [h, setH] = useState(false);
  const minPrice = getMinRetailPrice(product);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer", position: "relative",
        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
        transform: h ? "translateY(-8px)" : "translateY(0)",
        boxShadow: h ? "0 24px 48px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
      }}>
      <div className="product-card-img" style={{
        height: 220, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #f5f5f7, #e8e8ed)", overflow: "hidden",
        transition: "transform 0.4s", transform: h ? "scale(1.05)" : "scale(1)",
      }}>
        <Image src={product.image} alt={product.name} width={200} height={200}
          style={{ objectFit: "contain", width: "70%", height: "70%" }} />
      </div>
      <div className="product-card-info" style={{ padding: "20px 24px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
          {product.category}
        </div>
        <div className="product-card-name" style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>{product.name}</div>
        <div className="product-card-desc" style={{ fontSize: 13, color: "#86868b", marginBottom: 16, lineHeight: 1.5, minHeight: 40 }}>{product.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 13, color: "#86868b" }}>최저 </span>
            <span className="product-card-price" style={{ fontSize: 22, fontWeight: 800, color: "#1d1d1f" }}>₩{minPrice.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 12, color: "#86868b" }}>
            {product.sizes.length}규격 · {product.availableColors.reduce((sum, c) => {
              const ci = COLOR_DETAILS[c];
              return sum + (ci?.subColors ? ci.subColors.length : 1);
            }, 0)}색상
          </div>
        </div>
        <button className="product-card-btn" style={{
          width: "100%", padding: "13px 0", border: "none", borderRadius: 12, color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.3s",
          background: h ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f",
        }}>옵션 선택하기</button>
      </div>
    </div>
  );
}

function ProductDetail({ product, onClose, onAddCart }: {
  product: FlashingProduct; onClose: () => void;
  onAddCart: (item: CartItem) => void;
}) {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [color, setColor] = useState(product.availableColors[0]);
  const [colorSub, setColorSub] = useState("");
  const [qty, setQty] = useState(1);

  const size = product.sizes[sizeIdx];
  const wholesale = size.wholesale[color] || 0;
  const retail = getRetailPrice(wholesale);
  const sycPrice = Math.round(retail / 100);
  const colorInfo = COLOR_DETAILS[color];

  const handleAdd = () => {
    onAddCart({
      key: `${product.id}-${size.label}-${color}-${colorSub}`,
      productId: product.id, productName: product.name,
      size: size.label, color: colorInfo?.label || color,
      colorSub: colorSub || undefined, retailPrice: retail, qty,
      category: "flashing",
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 40px 80px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          background: "linear-gradient(145deg, #f5f5f7, #e8e8ed)", padding: "32px",
          display: "flex", alignItems: "center", gap: 20, borderRadius: "24px 24px 0 0", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.06)", border: "none",
            width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer",
          }}>✕</button>
          <div style={{ width: 120, height: 120, flexShrink: 0 }}>
            <Image src={product.image} alt={product.name} width={120} height={120}
              style={{ objectFit: "contain", width: "100%", height: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", letterSpacing: 1.5, marginBottom: 4 }}>{product.category}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1d1d1f" }}>{product.name}</div>
            <div style={{ fontSize: 14, color: "#86868b", marginTop: 4 }}>{product.desc}</div>
          </div>
        </div>
        <div style={{ padding: "24px 32px 32px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 10 }}>규격 선택</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.sizes.map((s, i) => (
                <button key={s.label} onClick={() => setSizeIdx(i)} style={{
                  padding: "10px 20px", borderRadius: 12, border: "2px solid",
                  borderColor: sizeIdx === i ? "#7b5ea7" : "#e8e8ed",
                  background: sizeIdx === i ? "rgba(123,94,167,0.06)" : "#fff",
                  color: sizeIdx === i ? "#7b5ea7" : "#1d1d1f",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>{s.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 10 }}>색상 / 소재</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.availableColors.map(c => {
                const ci = COLOR_DETAILS[c];
                return (
                  <button key={c} onClick={() => { setColor(c); setColorSub(""); }} style={{
                    padding: "10px 16px", borderRadius: 12, border: "2px solid",
                    borderColor: color === c ? "#7b5ea7" : "#e8e8ed",
                    background: color === c ? "rgba(123,94,167,0.06)" : "#fff",
                    cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: ci?.hex || "#ccc", border: "1px solid rgba(0,0,0,0.1)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: color === c ? "#7b5ea7" : "#1d1d1f" }}>{ci?.label || c}</span>
                  </button>
                );
              })}
            </div>
            {colorInfo?.subColors && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {colorInfo.subColors.map(sc => (
                  <button key={sc} onClick={() => setColorSub(sc)} style={{
                    padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: "1.5px solid", cursor: "pointer", transition: "all 0.2s",
                    borderColor: colorSub === sc ? "#3ee6c4" : "#e8e8ed",
                    background: colorSub === sc ? "rgba(62,230,196,0.06)" : "#fafafa",
                    color: colorSub === sc ? "#0f8a6c" : "#6e6e73",
                  }}>{sc}</button>
                ))}
              </div>
            )}
            {product.note && <div style={{ marginTop: 8, fontSize: 12, color: "#86868b", fontStyle: "italic" }}>※ {product.note}</div>}
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 10 }}>수량</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f5f5f7", borderRadius: 12, width: "fit-content" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>−</button>
              <input type="number" value={qty} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setQty(v); else if (e.target.value === "") setQty(1); }}
                onBlur={() => { if (qty < 1) setQty(1); }}
                style={{ width: 56, height: 36, textAlign: "center", fontSize: 16, fontWeight: 700, border: "2px solid #e8e8ed", borderRadius: 10, background: "#fff", outline: "none" }} min={1} />
              <button onClick={() => setQty(qty + 1)} style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>+</button>
            </div>
          </div>
          <div style={{ background: "#f5f5f7", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: "#6e6e73" }}>단가</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>₩{retail.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: "#6e6e73" }}>수량</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>×{qty}</span>
            </div>
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>합계</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1d1d1f" }}>₩{(retail * qty).toLocaleString()}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7b5ea7", marginTop: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <Image src="/syc-logo.png" alt="" width={14} height={14} style={{ borderRadius: "50%" }} />
                  {(sycPrice * qty).toLocaleString()} SYC
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleAdd} style={{
            width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
            background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(123,94,167,0.3)",
          }}>장바구니 담기</button>
        </div>
      </div>
    </div>
  );
}

const CUSTOM_COLORS = [
  { id: "ivory", name: "아이보리", price: 35, hex: "#F5F0E1", jjambap: true, hasSide: true },
  { id: "standard", name: "기성단색", price: 40, hex: "#607D8B", sub: ["은회색", "백색", "군청색"], jjambap: true, hasSide: true },
  { id: "special", name: "특이단색", price: 45, hex: "#424242", sub: ["진회색", "티타늄실버"], jjambap: true, hasSide: true },
  { id: "print", name: "프린트", price: 50, hex: "#2C2C2C", sub: ["징크블랙", "리얼징크", "유니스톤"], jjambap: true, hasSide: true },
  { id: "galv10", name: "아연 1.0T", price: 70, hex: "#B0BEC5", jjambap: false, hasSide: false },
  { id: "galv12", name: "아연 1.2T", price: 90, hex: "#90A4AE", jjambap: false, hasSide: false },
  { id: "steel", name: "스틸 1.0T", price: 80, hex: "#546E7A", jjambap: false, hasSide: true },
];

function CustomFlashingModal({ onClose, onAddCart }: { onClose: () => void; onAddCart: (item: CartItem) => void }) {
  const [step, setStep] = useState(0);
  const [pts, setPts] = useState<{x:number;y:number}[]>([]);
  const [dims, setDims] = useState<string[]>([]);
  const [angles, setAngles] = useState<string[]>([]);
  const [cId, setCId] = useState<string|null>(null);
  const [cSub, setCSub] = useState("");
  const [side, setSide] = useState("ext");
  const [qty, setQty] = useState(1);
  const [hov, setHov] = useState<{x:number;y:number}|null>(null);
  const cvs = useRef<HTMLCanvasElement>(null);

  const calcAngleDeg = (p1:{x:number;y:number}, p2:{x:number;y:number}, p3:{x:number;y:number}) => {
    const a = { x: p1.x - p2.x, y: p1.y - p2.y };
    const b = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = a.x * b.x + a.y * b.y;
    const magA = Math.sqrt(a.x * a.x + a.y * a.y);
    const magB = Math.sqrt(b.x * b.x + b.y * b.y);
    if (magA === 0 || magB === 0) return 0;
    const raw = Math.round(Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB)))) * 180 / Math.PI);
    // 75~105도 범위면 90도로 스냅
    if (raw >= 75 && raw <= 105) return 90;
    return raw;
  };

  const draw = useCallback(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,0,0,0.04)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (!pts.length) return;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "#7b5ea7"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i+1], mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2, d = dims[i]||"";
      ctx.save(); ctx.font = "bold 11px sans-serif";
      const t = d ? `${d}mm` : "?", tw = ctx.measureText(t).width;
      ctx.fillStyle = d ? "rgba(123,94,167,0.9)" : "rgba(180,180,180,0.9)";
      ctx.beginPath(); ctx.roundRect(mx-tw/2-6, my-8, tw+12, 16, 4); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, mx, my); ctx.restore();
    }
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
      ctx.fillStyle = i===0 ? "#3ee6c4" : "#7b5ea7"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i+1), p.x, p.y);
    });
    // 각도 표시 (90도 아닌 경우만 빨간색으로)
    for (let i = 1; i < pts.length - 1; i++) {
      const deg = angles[i-1] && parseInt(angles[i-1]) > 0 ? parseInt(angles[i-1]) : calcAngleDeg(pts[i-1], pts[i], pts[i+1]);
      if (deg === 0 || deg === 90) continue;  // 90도는 표시 안 함
      const p = pts[i];
      const a1 = Math.atan2(pts[i-1].y - p.y, pts[i-1].x - p.x);
      const a2 = Math.atan2(pts[i+1].y - p.y, pts[i+1].x - p.x);
      ctx.save();
      const r = 22;
      // 안쪽(좁은 각도)에 호 그리기
      const normDiff = ((a2 - a1) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
      const ccw = normDiff > Math.PI;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, r, a1, a2, ccw);
      ctx.closePath();
      ctx.fillStyle = "rgba(220,38,38,0.12)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, a1, a2, ccw);
      ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#dc2626";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // 호의 중간점에 텍스트
      const midA = ccw
        ? a1 - ((2*Math.PI - normDiff) / 2)
        : a1 + (normDiff / 2);
      ctx.fillText(`${deg}°`, p.x + Math.cos(midA) * (r + 14), p.y + Math.sin(midA) * (r + 14));
      ctx.restore();
    }
    if (hov && pts.length > 0 && step === 1) {
      const last = pts[pts.length-1];
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(hov.x, hov.y);
      ctx.strokeStyle = "rgba(123,94,167,0.3)"; ctx.lineWidth = 2; ctx.setLineDash([6,3]); ctx.stroke(); ctx.setLineDash([]);
    }
  }, [pts, dims, angles, hov, step]);

  useEffect(() => { draw(); }, [draw]);

  const click = (e: React.MouseEvent) => { if (step!==1||!cvs.current) return; const r = cvs.current.getBoundingClientRect(); const x = (e.clientX-r.left)*(cvs.current.width/r.width); const y = (e.clientY-r.top)*(cvs.current.height/r.height); setPts(p=>[...p,{x,y}]); if(pts.length>0) setDims(p=>[...p,""]); if(pts.length>1) setAngles(p=>[...p,""]); };
  const mv = (e: React.MouseEvent) => { if(step!==1||!cvs.current) return; const r = cvs.current.getBoundingClientRect(); setHov({x:(e.clientX-r.left)*(cvs.current.width/r.width),y:(e.clientY-r.top)*(cvs.current.height/r.height)}); };
  const dimCh = (i:number,v:string) => setDims(p => { const n=[...p]; n[i]=v.replace(/[^0-9]/g,""); return n; });
  const angleCh = (i:number,v:string) => setAngles(p => { const n=[...p]; n[i]=v.replace(/[^0-9]/g,""); return n; });
  const undo = () => { if(pts.length<=1){setPts([]);setDims([]);setAngles([]);}else{setPts(p=>p.slice(0,-1));setDims(p=>p.slice(0,-1));if(angles.length>0)setAngles(p=>p.slice(0,-1));} };
  const reset = () => { setPts([]);setDims([]);setAngles([]);setCId(null);setCSub("");setSide("ext");setQty(1);setStep(1); };

  const totalW = dims.reduce((s,d) => s+(parseInt(d)||0), 0);
  const cObj = CUSTOM_COLORS.find(c => c.id===cId);
  const jjW = cObj?.jjambap ? 20 : 0;
  const calcW = totalW + jjW;
  const unit = cObj ? calcW * cObj.price : 0;
  const total = unit * qty;
  const allOk = dims.length > 0 && dims.every(d => d && parseInt(d)>0);

  const handleAddCart = () => {
    if (!cObj) return;
    const key = `custom_${Date.now()}`;
    const canvasImage = cvs.current ? cvs.current.toDataURL("image/png") : undefined;
    const angleInfo = angles.length > 0 ? angles.map((a,i) => {
      const deg = a && parseInt(a) > 0 ? parseInt(a) : calcAngleDeg(pts[i], pts[i+1], pts[i+2]);
      return deg;
    }) : [];
    const hasNon90 = angleInfo.some(d => d !== 90);
    const angleStr = hasNon90 ? ` [${angleInfo.map((d,i) => d !== 90 ? `점${i+2}:${d}°` : "").filter(Boolean).join(",")}]` : "";
    onAddCart({
      key,
      productId: key,
      productName: "이형 후레싱",
      size: `W${calcW}mm (${dims.map(d=>d+"mm").join("+")})${angleStr}`,
      color: cObj.name + (cSub ? ` (${cSub})` : "") + (cObj.hasSide ? ` · ${side==="ext"?"외부":"내부"}` : ""),
      retailPrice: unit,
      qty,
      image: canvasImage,
      category: "flashing",
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={onClose}>
      <div style={{ background: "#f5f5f7", borderRadius: 24, width: "calc(100% - 32px)", maxWidth: 500, height: "85vh", display: "flex", flexDirection: "column", position: "relative" }} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0a2540)", padding: "16px 20px", borderRadius: "24px 24px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 11, color: "#3ee6c4", fontWeight: 600 }}>이형 후레싱</span>
            <div style={{ fontSize: 16, fontWeight: 800 }}>맞춤 절곡 주문</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#86868b" }}>Step {step+1}/5</span>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, padding: "8px 20px 0", flexShrink: 0 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=step ? "linear-gradient(135deg,#7b5ea7,#3ee6c4)" : "#ddd" }}/>)}
        </div>

        <div style={{ padding: "12px 20px 24px", flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* STEP 0 */}
          {step===0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginTop: 0, marginBottom: 12 }}>주문 방법</h3>
              {["캔버스에 점을 클릭해서 절곡 단면을 그려요","각 구간의 치수(mm)를 입력해요","색상 + 외부/내부 선택 → 자동 견적!","확인 후 장바구니에 담으세요"].map((t,i) => (
                <div key={i} style={{ display:"flex",gap:10,padding:"6px 0",alignItems:"center" }}>
                  <div style={{ width:24,height:24,borderRadius:7,background:"linear-gradient(135deg,#7b5ea7,#3ee6c4)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:13 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop:10,padding:8,background:"rgba(62,230,196,0.06)",borderRadius:8,fontSize:11,color:"#0f8a6c",lineHeight:1.5 }}>
                💡 절곡 단면을 옆에서 본 형태대로 꺾이는 지점마다 점을 찍으세요<br/>💡 C/S는 양끝 짬밥 10mm×2 = +20mm 자동 추가
              </div>
              <button onClick={()=>setStep(1)} style={{ width:"100%",marginTop:12,padding:"12px 0",border:"none",borderRadius:12,background:"linear-gradient(135deg,#7b5ea7,#3ee6c4)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer" }}>시작하기</button>
            </div>
          )}

          {/* STEP 1 */}
          {step===1 && (
            <div style={{ background:"#fff",borderRadius:16,overflow:"hidden" }}>
              <div style={{ padding:"8px 16px",borderBottom:"1px solid #f0f0f2",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:12,color:"#6e6e73" }}>점 <b style={{color:"#7b5ea7"}}>{pts.length}</b>개 · 구간 <b style={{color:"#7b5ea7"}}>{Math.max(0,pts.length-1)}</b>개</span>
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={undo} disabled={!pts.length} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid #e0e0e0",background:"#fff",fontSize:11,cursor:"pointer",opacity:pts.length?1:0.4 }}>↩ 되돌리기</button>
                  <button onClick={reset} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid #e0e0e0",background:"#fff",fontSize:11,cursor:"pointer" }}>🗑 초기화</button>
                </div>
              </div>
              <div style={{ position:"relative",cursor:"crosshair" }}>
                <canvas ref={cvs} width={600} height={240} onClick={click} onMouseMove={mv} onMouseLeave={()=>setHov(null)} style={{ width:"100%",height:240,display:"block" }}/>
                {!pts.length && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",color:"#86868b",textAlign:"center" }}><div><div style={{fontSize:28,marginBottom:4}}>👆</div><div style={{fontSize:13,fontWeight:600}}>클릭해서 시작점을 찍으세요</div></div></div>}
              </div>
              <div style={{ padding:12 }}>
                <button onClick={()=>{if(pts.length>=2)setStep(2);}} disabled={pts.length<2} style={{ width:"100%",padding:"10px 0",border:"none",borderRadius:10,background:pts.length>=2?"linear-gradient(135deg,#7b5ea7,#3ee6c4)":"#e0e0e0",color:"#fff",fontSize:13,fontWeight:700,cursor:pts.length>=2?"pointer":"default" }}>다음: 치수 입력 →</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div style={{ background:"#fff",borderRadius:16,overflow:"hidden" }}>
              <canvas ref={cvs} width={600} height={240} style={{ width:"100%",height:240,display:"block" }}/>
              <div style={{ padding:"12px 16px" }}>
                <div style={{ fontSize:14,fontWeight:700,marginBottom:8 }}>각 구간 치수 (mm)</div>
                {dims.map((d,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#f5f5f7",borderRadius:10,marginBottom:6 }}>
                    <div style={{ width:22,height:22,borderRadius:6,background:"#7b5ea7",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800 }}>{i+1}</div>
                    <span style={{ fontSize:12,color:"#6e6e73",flex:1 }}>점{i+1}→점{i+2}</span>
                    <input type="text" inputMode="numeric" value={d} onChange={e=>dimCh(i,e.target.value)} placeholder="0"
                      style={{ width:70,padding:"6px 10px",borderRadius:8,border:`2px solid ${d?"#7b5ea7":"#e0e0e0"}`,fontSize:15,fontWeight:700,textAlign:"right",outline:"none" }}/>
                    <span style={{ fontSize:11,color:"#86868b" }}>mm</span>
                  </div>
                ))}
                {/* 각도 입력 */}
                {pts.length >= 3 && (
                  <>
                    <div style={{ fontSize:14,fontWeight:700,marginTop:16,marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
                      <span>꺾임 각도</span>
                      <span style={{ fontSize:11,color:"#86868b",fontWeight:400 }}>90°가 아닌 경우만 수정하세요</span>
                    </div>
                    {angles.map((a,i) => {
                      const autoDeg = calcAngleDeg(pts[i], pts[i+1], pts[i+2]);
                      const effectiveDeg = a && parseInt(a) > 0 ? parseInt(a) : autoDeg;
                      const isNot90 = effectiveDeg !== 90;
                      return (
                        <div key={`a${i}`} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background: isNot90 ? "rgba(220,38,38,0.04)" : "#f5f5f7",borderRadius:10,marginBottom:6,border: isNot90 ? "1px solid rgba(220,38,38,0.2)" : "1px solid transparent" }}>
                          <div style={{ width:22,height:22,borderRadius:6,background: isNot90 ? "#dc2626" : "#86868b",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800 }}>∠</div>
                          <span style={{ fontSize:12,color:"#6e6e73",flex:1 }}>점{i+2} 꺾임</span>
                          <input type="text" inputMode="numeric" value={a} onChange={e=>angleCh(i,e.target.value)} placeholder={String(autoDeg)}
                            style={{ width:56,padding:"6px 8px",borderRadius:8,border:`2px solid ${isNot90?"#dc2626":"#e0e0e0"}`,fontSize:15,fontWeight:700,textAlign:"right",outline:"none",color: isNot90 ? "#dc2626" : "#1d1d1f" }}/>
                          <span style={{ fontSize:11,color: isNot90 ? "#dc2626" : "#86868b" }}>°</span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div style={{ marginTop:8,padding:10,background:"rgba(123,94,167,0.06)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>총 사용폭 (W)</span>
                  <span style={{ fontSize:20,fontWeight:800,color:"#7b5ea7" }}>{totalW.toLocaleString()} mm</span>
                </div>
                <div style={{ display:"flex",gap:8,marginTop:10 }}>
                  <button onClick={()=>setStep(1)} style={{ flex:1,padding:"10px 0",borderRadius:10,border:"2px solid #e0e0e0",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>← 다시 그리기</button>
                  <button onClick={()=>{if(allOk)setStep(3);}} disabled={!allOk} style={{ flex:2,padding:"10px 0",border:"none",borderRadius:10,background:allOk?"linear-gradient(135deg,#7b5ea7,#3ee6c4)":"#e0e0e0",color:"#fff",fontSize:13,fontWeight:700,cursor:allOk?"pointer":"default" }}>다음: 옵션 선택 →</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div style={{ background:"#fff",borderRadius:16,padding:16 }}>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:4 }}>색상 / 소재</div>
              <div style={{ fontSize:12,color:"#86868b",marginBottom:10 }}>총폭 {totalW}mm × mm당 단가</div>
              {CUSTOM_COLORS.map(c => (
                <div key={c.id} style={{ marginBottom:4 }}>
                  <button onClick={()=>{setCId(c.id);setCSub("");}} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:`2px solid ${cId===c.id?"#7b5ea7":"#eee"}`,background:cId===c.id?"rgba(123,94,167,0.04)":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:18,height:18,borderRadius:9,background:c.hex,border:"1px solid rgba(0,0,0,0.1)" }}/>
                      <span style={{ fontSize:13,fontWeight:600,color:cId===c.id?"#7b5ea7":"#1d1d1f" }}>{c.name}</span>
                      {c.jjambap && <span style={{ fontSize:9,color:"#86868b",background:"#f0f0f2",padding:"1px 5px",borderRadius:4 }}>+짬밥20</span>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:13,fontWeight:700,color:cId===c.id?"#7b5ea7":"#1d1d1f" }}>₩{((totalW+(c.jjambap?20:0))*c.price).toLocaleString()}</span>
                      <span style={{ fontSize:10,color:"#86868b",marginLeft:4 }}>@{c.price}/mm</span>
                    </div>
                  </button>
                  {cId===c.id && c.sub && (
                    <div style={{ display:"flex",gap:4,marginTop:4,marginLeft:26,flexWrap:"wrap" }}>
                      {c.sub.map(s => <button key={s} onClick={()=>setCSub(s)} style={{ padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:`1.5px solid ${cSub===s?"#3ee6c4":"#eee"}`,background:cSub===s?"rgba(62,230,196,0.06)":"#fafafa",color:cSub===s?"#0f8a6c":"#6e6e73" }}>{s}</button>)}
                    </div>
                  )}
                </div>
              ))}
              {cObj?.jjambap && <div style={{ marginTop:8,padding:8,background:"rgba(62,230,196,0.06)",borderRadius:8,fontSize:11,color:"#0f8a6c",lineHeight:1.5 }}>📐 C/S 짬밥 +20mm → 계산폭: {totalW}+20 = <b>{totalW+20}mm</b></div>}
              {cObj?.hasSide && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:14,fontWeight:700,marginBottom:8 }}>마감 방향</div>
                  <div style={{ display:"flex",gap:8 }}>
                    {[{id:"ext",label:"외부",desc:"색상면 바깥"},{id:"int",label:"내부",desc:"색상면 안쪽"}].map(s => (
                      <button key={s.id} onClick={()=>setSide(s.id)} style={{ flex:1,padding:12,borderRadius:12,border:`2px solid ${side===s.id?"#7b5ea7":"#eee"}`,background:side===s.id?"rgba(123,94,167,0.04)":"#fff",cursor:"pointer",textAlign:"center" }}>
                        <svg width="120" height="90" viewBox="0 0 120 90" style={{ display:"block",margin:"0 auto 8px" }}>
                          {s.id==="ext" ? (<>
                            {/* 외부: 검은 ㄱ자 */}
                            <line x1="30" y1="8" x2="30" y2="60" stroke="#222" strokeWidth="3"/>
                            <line x1="30" y1="60" x2="105" y2="60" stroke="#222" strokeWidth="3"/>
                            {/* 노란 색상면 - 바깥쪽(왼쪽+아래) */}
                            <line x1="26" y1="8" x2="26" y2="63" stroke="#f1c40f" strokeWidth="5"/>
                            <line x1="26" y1="64" x2="105" y2="64" stroke="#f1c40f" strokeWidth="5"/>
                            {/* 빨간 화살표 - 왼쪽 아래 바깥에서 가리킴 */}
                            <line x1="8" y1="82" x2="22" y2="68" stroke="#e74c3c" strokeWidth="3"/>
                            <polygon points="22,68 14,70 18,78" fill="#e74c3c"/>
                            <text x="0" y="55" fontSize="0" fill="none"/>
                          </>) : (<>
                            {/* 내부: 검은 ㄱ자 */}
                            <line x1="30" y1="8" x2="30" y2="60" stroke="#222" strokeWidth="3"/>
                            <line x1="30" y1="60" x2="105" y2="60" stroke="#222" strokeWidth="3"/>
                            {/* 노란 색상면 - 안쪽(오른쪽+위) */}
                            <line x1="34" y1="8" x2="34" y2="57" stroke="#f1c40f" strokeWidth="5"/>
                            <line x1="34" y1="56" x2="105" y2="56" stroke="#f1c40f" strokeWidth="5"/>
                            {/* 빨간 화살표 - 안쪽에서 아래로 가리킴 */}
                            <line x1="60" y1="25" x2="42" y2="48" stroke="#e74c3c" strokeWidth="3"/>
                            <polygon points="42,48 44,38 52,43" fill="#e74c3c"/>
                            <text x="0" y="55" fontSize="0" fill="none"/>
                          </>)}
                        </svg>
                        <div style={{ fontSize:14,fontWeight:700,color:side===s.id?"#7b5ea7":"#1d1d1f" }}>{s.label}</div>
                        <div style={{ fontSize:11,color:"#86868b" }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display:"flex",gap:8,marginTop:14 }}>
                <button onClick={()=>setStep(2)} style={{ flex:1,padding:"10px 0",borderRadius:10,border:"2px solid #e0e0e0",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>← 치수</button>
                <button onClick={()=>{if(cId)setStep(4);}} disabled={!cId} style={{ flex:2,padding:"10px 0",border:"none",borderRadius:10,background:cId?"linear-gradient(135deg,#7b5ea7,#3ee6c4)":"#e0e0e0",color:"#fff",fontSize:13,fontWeight:700,cursor:cId?"pointer":"default" }}>다음: 견적 확인 →</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step===4 && cObj && (
            <div style={{ background:"#fff",borderRadius:16,overflow:"hidden" }}>
              <canvas ref={cvs} width={600} height={240} style={{ width:"100%",height:240,display:"block" }}/>
              <div style={{ padding:"12px 16px" }}>
                <div style={{ fontSize:16,fontWeight:800,marginBottom:10 }}>견적 요약</div>
                <div style={{ background:"#f5f5f7",borderRadius:12,padding:12,fontSize:13,marginBottom:12 }}>
                  {[
                    ["형태",`이형 · ${pts.length}점 ${dims.length}구간`],
                    ["치수",dims.map(d=>d+"mm").join(" + ")],
                    ...(angles.length > 0 ? [["각도", angles.map((a,i) => { const deg = a && parseInt(a) > 0 ? parseInt(a) : calcAngleDeg(pts[i], pts[i+1], pts[i+2]); return `점${i+2}:${deg}°`; }).join(", ")]] : [] as string[][]),
                    ["총폭",`${totalW} mm`],
                    ...(cObj.jjambap?[["짬밥","+20mm"]]:[] as string[][]),
                    ["계산폭 (W)",`${calcW} mm`],
                    ["색상",`${cObj.name}${cSub?` (${cSub})`:""}${cObj.hasSide?` · ${side==="ext"?"외부":"내부"}`:""}`],
                    ["단가",`${calcW} × ₩${cObj.price} = ₩${unit.toLocaleString()}`],
                  ].map(([k,v],i,a) => (
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<a.length-1?"1px solid #eee":"none" }}>
                      <span style={{ color:"#6e6e73" }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>수량</span>
                  <div style={{ display:"flex",alignItems:"center",background:"#f5f5f7",borderRadius:8 }}>
                    <button onClick={()=>setQty(Math.max(1,qty-1))} style={{ width:34,height:34,border:"none",background:"none",cursor:"pointer",fontSize:18,fontWeight:700 }}>−</button>
                    <input type="number" value={qty} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setQty(v); else if (e.target.value === "") setQty(1); }}
                      onBlur={() => { if (qty < 1) setQty(1); }}
                      style={{ width:50,height:30,textAlign:"center",fontSize:16,fontWeight:700,border:"2px solid #e8e8ed",borderRadius:8,background:"#fff",outline:"none" }} min={1} />
                    <button onClick={()=>setQty(qty+1)} style={{ width:34,height:34,border:"none",background:"none",cursor:"pointer",fontSize:18,fontWeight:700 }}>+</button>
                  </div>
                </div>
                <div style={{ background:"linear-gradient(135deg,rgba(123,94,167,0.06),rgba(62,230,196,0.06))",borderRadius:12,padding:14,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontSize:15,fontWeight:700 }}>합계</span>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:24,fontWeight:800 }}>₩{total.toLocaleString()}</div>
                    <div style={{ fontSize:12,fontWeight:700,color:"#7b5ea7" }}>{Math.round(total/100).toLocaleString()} SYC</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>setStep(3)} style={{ flex:1,padding:"10px 0",borderRadius:10,border:"2px solid #e0e0e0",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>← 옵션</button>
                  <button onClick={handleAddCart} style={{ flex:2,padding:"12px 0",border:"none",borderRadius:12,background:"linear-gradient(135deg,#7b5ea7,#3ee6c4)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 20px rgba(123,94,167,0.3)" }}>장바구니 담기</button>
                </div>
                <button onClick={reset} style={{ width:"100%",marginTop:6,padding:8,border:"none",background:"none",fontSize:12,color:"#86868b",cursor:"pointer" }}>새로운 이형 주문하기</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cat, setCat] = useState("전체");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartAddedItem, setCartAddedItem] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [vis, setVis] = useState(false);
  const [pay, setPay] = useState("krw");
  const [detail, setDetail] = useState<FlashingProduct | null>(null);
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [mainTab, setMainTab] = useState<"후레싱" | "행가도어" | "스윙도어">("후레싱");
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMyPage, setShowMyPage] = useState<false | "info" | "address">(false);
  const [orderComplete, setOrderComplete] = useState<{ paymentId: string; totalAmount: number; receiptUrl?: string } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ═══ SYC 코인 결제 상태 ═══
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [sycPrice, setSycPrice] = useState<SycPrice | null>(null);
  const [sycPriceLoading, setSycPriceLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);

  // ═══ Firestore 장바구니 실시간 동기화 ═══
  // 장바구니/모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = showCart ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCart]);

  // 로그인 시: Firestore에서 실시간 구독 (PC↔모바일 동기화!)
  // 비로그인 시: localStorage 폴백 (게스트 사용자 지원)
  useEffect(() => {
    if (user) {
      // 로그인 → Firestore 실시간 구독
      const unsub = subscribeCart(user.uid, (items) => {
        setCart(items);
      });
      return () => unsub();
    } else {
      // 비로그인 → localStorage 폴백
      try {
        const saved = localStorage.getItem("sy_cart");
        if (saved) setCart(JSON.parse(saved));
      } catch {}
    }
  }, [user]);

  // 비로그인 상태에서만 localStorage 백업
  useEffect(() => {
    if (!user) {
      try { localStorage.setItem("sy_cart", JSON.stringify(cart)); } catch {}
    }
  }, [cart, user]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showAuth || !user) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAuth(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAuth, user]);

  useEffect(() => {
    setVis(true);
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);

    // Firebase 로그인 상태 감지 (+ 마이그레이션)
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await migrateLocalData(firebaseUser.uid);
      }
    });

    return () => { window.removeEventListener("scroll", h); unsub(); };
  }, []);

  const filtered = FLASHING_PRODUCTS.filter(p => {
    const catMatch = cat === "전체" || p.category === cat;
    const searchMatch = !search || p.name.includes(search) || p.desc.includes(search) || p.id.includes(search.toLowerCase());
    return catMatch && searchMatch;
  });
  const addToCart = (item: CartItem) => {
    if (user) {
      // 로그인 → Firestore에 저장 (subscribeCart가 자동으로 state 업데이트)
      const existing = cart.find(i => i.key === item.key);
      const newItem = existing ? { ...existing, qty: existing.qty + item.qty } : item;
      setCartItem(user.uid, newItem);
    } else {
      // 비로그인 → localStorage만
      setCart(prev => {
        const ex = prev.find(i => i.key === item.key);
        if (ex) return prev.map(i => i.key === item.key ? { ...i, qty: i.qty + item.qty } : i);
        return [...prev, item];
      });
    }
    setCartAddedItem(item.productName);
  };
  const removeFromCart = (key: string) => {
    if (user) {
      removeCartItem(user.uid, key);
    } else {
      setCart(prev => prev.filter(i => i.key !== key));
    }
  };
  const updateQty = (key: string, d: number) => {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    const newQty = Math.max(1, item.qty + d);
    if (user) {
      setCartItem(user.uid, { ...item, qty: newQty });
    } else {
      setCart(prev => prev.map(i => i.key === key ? { ...i, qty: newQty } : i));
    }
  };
  const setItemQty = (key: string, q: number) => {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    const newQty = Math.max(1, q);
    if (user) {
      setCartItem(user.uid, { ...item, qty: newQty });
    } else {
      setCart(prev => prev.map(i => i.key === key ? { ...i, qty: newQty } : i));
    }
  };
  const cartTotal = cart.reduce((s, i) => s + i.retailPrice * i.qty, 0);
  const cartSyc = Math.round(cartTotal / 100);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ═══ 결제 처리 ═══

  // SYC 시세 조회 (SYC 탭 선택 시 자동)
  const fetchSycPrice = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;
    setSycPriceLoading(true);
    try {
      const price = await getSycPrice();
      setSycPrice(price);
    } catch (err) {
      console.error("SYC 시세 조회 실패:", err);
    } finally {
      setSycPriceLoading(false);
    }
  }, []);

  // SYC 탭 선택 시 시세 조회
  useEffect(() => {
    if (pay === "syc") {
      fetchSycPrice();
    }
  }, [pay, fetchSycPrice]);

  // 메타마스크 지갑 연결
  const handleConnectWallet = async () => {
    setWalletConnecting(true);
    try {
      await switchToBSC();
      const address = await connectWallet();
      const info = await getWalletInfo(address);
      setWallet(info);
      // 시세도 같이 갱신
      await fetchSycPrice();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || "지갑 연결에 실패했습니다.");
    } finally {
      setWalletConnecting(false);
    }
  };

  // 메타마스크 계정 변경 감지
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setWallet(null);
      } else {
        try {
          const info = await getWalletInfo(accounts[0]);
          setWallet(info);
        } catch { setWallet(null); }
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => { window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged); };
  }, []);

  const handlePayment = async () => {
    // 1. 로그인 확인
    if (!user) {
      setShowCart(false);
      setShowAuth(true);
      return;
    }
    // 2. 장바구니 확인
    if (cart.length === 0) return;

    // 3. 배송지 확인 (직접수령 제외)
    if (delivery !== "self") {
      const selectedAddr = savedAddresses.find(a => a.id === selectedAddrId);
      if (!selectedAddr) {
        alert("배송지를 선택해주세요.\n마이페이지에서 배송지를 추가할 수 있어요.");
        return;
      }
    }

    // ──── SYC 코인 결제 ────
    if (pay === "syc") {
      // 메타마스크 확인
      if (!isMetaMaskInstalled()) {
        alert("메타마스크가 설치되어 있지 않습니다.\n\n📱 모바일: MetaMask 앱을 설치 후, 앱 내 브라우저에서 접속해주세요.\n💻 PC: Chrome 확장프로그램을 설치해주세요.");
        return;
      }

      // 지갑 미연결 시 연결
      if (!wallet) {
        await handleConnectWallet();
        return;
      }

      // 시세 미조회 시
      if (!sycPrice) {
        alert("SYC 시세를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setPaymentLoading(true);
      try {
        // SYC 전송 실행
        const result = await sendSycPayment(sycFinalTotal);

        if (!result.success) {
          alert(result.error || "SYC 결제에 실패했습니다.");
          setPaymentLoading(false);
          return;
        }

        // Firestore에 주문 저장
        const subtotal = cartTotal;
        const tax = Math.floor((subtotal + deliveryFee) * 0.1);
        const totalAmount = subtotal + deliveryFee + tax;
        const paymentId = `syc-${result.txHash?.slice(0, 10)}-${Date.now()}`;

        const order: Order = {
          id: paymentId,
          paymentId: result.txHash || paymentId,
          status: "paid",
          items: cart.map(i => ({
            productName: i.productName,
            size: i.size,
            color: i.color,
            colorSub: i.colorSub,
            retailPrice: i.retailPrice,
            qty: i.qty,
            category: i.category,
          })),
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
          payMethod: "SYC",
          deliveryType: delivery,
          addressId: selectedAddrId || undefined,
          receiptUrl: result.txHash ? `https://bscscan.com/tx/${result.txHash}` : undefined,
          paidAt: new Date().toISOString(),
        };
        await saveOrder(user.uid, order);

        // 장바구니 비우기
        await clearCart(user.uid);
        setCart([]);

        // 결제 완료
        setShowCart(false);
        setOrderComplete({
          paymentId,
          totalAmount,
          receiptUrl: result.txHash ? `https://bscscan.com/tx/${result.txHash}` : undefined,
        });

        // 지갑 잔액 갱신
        if (wallet) {
          try {
            const info = await getWalletInfo(wallet.address);
            setWallet(info);
          } catch {}
        }
      } catch (err) {
        console.error("SYC 결제 처리 오류:", err);
        alert("SYC 결제 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    // ──── 원화 카드 결제 (기존 로직) ────
    const subtotal = cartTotal;
    const tax = Math.floor((subtotal + deliveryFee) * 0.1);
    const totalAmount = subtotal + deliveryFee + tax;
    const orderName = cart.length === 1
      ? cart[0].productName
      : `${cart[0].productName} 외 ${cart.length - 1}건`;
    const paymentId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 5. PortOne SDK 확인
    if (!window.PortOne) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setPaymentLoading(true);

    // 모바일 여부 판별
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ═══════════════════════════════════════════
    // 모바일: 리다이렉트 방식 (await 사용 안 함!)
    // ═══════════════════════════════════════════
    if (isMobile) {
      // 주문정보를 sessionStorage에 저장 (결제 완료 후 복원용)
      sessionStorage.setItem("pendingOrder", JSON.stringify({
        paymentId, orderName, totalAmount, cartSnapshot: cart,
        delivery, deliveryFee, selectedAddrId, truckRegion,
        subtotal, tax,
      }));

      // 장바구니 닫기
      setShowCart(false);

      // requestPayment 호출 (await 안 함! 페이지가 이동하므로)
      window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "store-7d43cea3-aa09-4466-a1fb-4a2840baf3fd",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "channel-key-f238aa16-fa21-42c6-8b96-3eb108805040",
        paymentId,
        orderName,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: user.displayName || undefined,
          email: user.email || undefined,
        },
        redirectUrl: `${window.location.origin}/payment/complete`,
      });
      // 모바일은 여기서 페이지 자체가 이동함 → 아래 코드 실행 안 됨
      return;
    }

    // ═══════════════════════════════════════════
    // PC: 팝업(iframe) 방식 (기존 await 방식)
    // ═══════════════════════════════════════════
    setShowCart(false);

    try {
      const response = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "store-7d43cea3-aa09-4466-a1fb-4a2840baf3fd",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "channel-key-f238aa16-fa21-42c6-8b96-3eb108805040",
        paymentId,
        orderName,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: user.displayName || undefined,
          email: user.email || undefined,
        },
      });

      // 7. 사용자 취소 또는 에러
      if (response.code) {
        if (response.code !== "USER_CANCEL") {
          alert(`결제 실패: ${response.message || "알 수 없는 오류"}`);
        }
        setPaymentLoading(false);
        setShowCart(true); // 결제 취소/실패 시 장바구니 다시 열기
        return;
      }

      // 8. 서버에서 결제 검증
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, totalAmount }),
      });
      const verifyResult = await verifyRes.json();

      if (!verifyResult.success) {
        alert(`결제 검증 실패: ${verifyResult.message}`);
        setPaymentLoading(false);
        setShowCart(true);
        return;
      }

      // 9. Firestore에 주문 저장
      const order: Order = {
        id: paymentId,
        paymentId,
        status: "paid",
        items: cart.map(i => ({
          productName: i.productName,
          size: i.size,
          color: i.color,
          colorSub: i.colorSub,
          retailPrice: i.retailPrice,
          qty: i.qty,
          category: i.category,
        })),
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        payMethod: verifyResult.payment?.method || "CARD",
        deliveryType: delivery,
        addressId: selectedAddrId || undefined,
        receiptUrl: verifyResult.payment?.receiptUrl,
        paidAt: verifyResult.payment?.paidAt || new Date().toISOString(),
      };
      await saveOrder(user.uid, order);

      // 10. 장바구니 비우기
      await clearCart(user.uid);
      setCart([]);

      // 11. 결제 완료 표시
      setShowCart(false);
      setOrderComplete({
        paymentId,
        totalAmount,
        receiptUrl: verifyResult.payment?.receiptUrl,
      });
    } catch (err) {
      console.error("결제 처리 오류:", err);
      alert("결제 중 오류가 발생했습니다. 다시 시도해주세요.");
      setShowCart(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  // 배송
  const [delivery, setDelivery] = useState<"self" | "parcel" | "truck">("parcel");
  const [truckRegion, setTruckRegion] = useState("");
  const [selectedTruck, setSelectedTruck] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address1: string; isDefault: boolean }[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);

  // 주소 → 용차 지역 매칭 (축약 주소 대응)
  const matchRegion = useCallback((address: string): string => {
    // 1단계: 정확히 시/군 이름이 포함되어 있는지 (일반 시/군 먼저)
    //   "경기도 평택시 ..." → "평택시" 매칭
    //   "충남 천안시 ..." → "천안시" 매칭
    const normalCities = TRUCK_FEES.filter(r =>
      !["서울시","인천시","세종시","부산광역시","대구광역시","울산광역시","광주광역시"].includes(r.city)
    );
    for (const r of normalCities) {
      const keyword = r.city.replace("(경기)", "");
      if (address.includes(keyword)) return r.city;
    }

    // 2단계: 광역시/특별시 축약 패턴 매칭
    const metroMap: [string[], string][] = [
      [["서울특별시","서울시","서울 "], "서울시"],
      [["인천광역시","인천시","인천 "], "인천시"],
      [["부산광역시","부산시","부산 "], "부산광역시"],
      [["대구광역시","대구시","대구 "], "대구광역시"],
      [["울산광역시","울산시","울산 "], "울산광역시"],
      [["세종특별자치시","세종시","세종 "], "세종시"],
    ];
    for (const [patterns, city] of metroMap) {
      if (patterns.some(p => address.includes(p))) return city;
    }
    // 광주: 경기 광주 vs 광주광역시 구분
    if (address.includes("광주광역시") || (address.includes("광주") && !address.includes("경기"))) {
      // "경기" 없이 "광주"만 있으면 광주광역시
      if (!address.includes("경기")) return "광주광역시";
    }

    return "";
  }, []);

  // ═══ Firestore 배송지 실시간 동기화 ═══
  useEffect(() => {
    if (!user) { setSavedAddresses([]); return; }
    const unsub = subscribeAddresses(user.uid, (addrs) => {
      setSavedAddresses(addrs);
      // 기본 배송지 자동 선택 (첫 로드 시)
      if (addrs.length > 0 && !selectedAddrId) {
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def) {
          setSelectedAddrId(def.id);
          const city = matchRegion(def.address1);
          if (city) setTruckRegion(city);
        }
      }
    });
    return () => unsub();
  }, [user, selectedAddrId, matchRegion]);

  // 배송지 선택 시 지역 매칭
  const selectAddr = (addrId: string) => {
    setSelectedAddrId(addrId);
    setSelectedTruck(0);
    const addr = savedAddresses.find(a => a.id === addrId);
    if (addr) {
      const city = matchRegion(addr.address1);
      setTruckRegion(city);
    }
  };

  // 택배비 계산
  const hasHanga = cart.some(i => i.category === "hanga");
  const calcParcelFee = () => {
    if (hasHanga) return null; // 행가도어 포함 시 택배 불가
    let fee = 0;
    const flashingQty = cart.filter(i => i.category === "flashing").reduce((s, i) => s + i.qty, 0);
    if (flashingQty > 0) fee += Math.ceil(flashingQty / 10) * 25000;
    cart.filter(i => i.category === "swing").forEach(i => {
      const isDouble = i.productName.includes("양개");
      const panels = isDouble ? 2 : 1;
      fee += panels * i.qty * 30000;
    });
    return fee;
  };
  const parcelFee = calcParcelFee();

  // 용차 옵션 계산
  const truckOptions = truckRegion ? calcTruckOptions(cart, truckRegion) : [];

  // 배송 팁: 택배 vs 용차 비교
  const cheapestTruck = truckOptions.find(o => o.type === "1t" || o.type === "5t");
  const deliveryTip = (() => {
    if (!parcelFee || !cheapestTruck) return null;
    if (cheapestTruck.totalFee <= parcelFee) {
      return "truck_cheaper" as const; // 용차가 택배보다 싸거나 같음
    }
    if (cheapestTruck.totalFee - parcelFee <= 30000) {
      return "recommend_truck" as const; // 택배-용차 차이 3만원 이내 → 용차 추천
    }
    return null;
  })();

  // 조합 차량 시 소량 추가분 안내
  const comboTruck = truckOptions.find(o => o.type === "combo");
  const comboTip = comboTruck && comboTruck.trucks.length > 1;

  // 배송비 최종 계산
  const calcDeliveryFee = () => {
    if (delivery === "self") return 0;
    if (delivery === "parcel") return parcelFee ?? 0;
    if (delivery === "truck" && truckOptions[selectedTruck]) return truckOptions[selectedTruck].totalFee;
    return 0;
  };
  const deliveryFee = calcDeliveryFee();

  // 원화→SYC 실시간 환산
  const cartSycRealtime = sycPrice ? krwToSyc(cartTotal, sycPrice) : cartSyc;
  const deliverySycRealtime = sycPrice && deliveryFee > 0 ? krwToSyc(deliveryFee, sycPrice) : Math.round(deliveryFee / 100);
  const sycDiscount = Math.floor(cartSycRealtime * 0.1);
  const sycSubtotalAfterDiscount = cartSycRealtime - sycDiscount + deliverySycRealtime;
  const sycTax = Math.floor(sycSubtotalAfterDiscount * 0.1);
  const sycFinalTotal = sycSubtotalAfterDiscount + sycTax;

  // 행가도어 포함 시 택배 선택 불가 → 자동 전환
  useEffect(() => {
    if (hasHanga && delivery === "parcel") setDelivery("self");
  }, [hasHanga, delivery]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* 모바일 반응형 스타일 */}
      <style>{`
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        @media (max-width: 767px) {
          .hero-title { font-size: 22px !important; }
          .hero-sub { font-size: 12px !important; }
          .hero-section { padding: 24px 16px 16px !important; }
          .hero-stats { gap: 12px !important; padding: 8px 16px !important; }
          .hero-stats span { font-size: 11px !important; }
          .section-title { font-size: 22px !important; }
          .section-sub { font-size: 13px !important; }
          .coil-banner { padding: 6px 12px !important; white-space: normal !important; text-align: center !important; }
          .coil-banner span { font-size: 10px !important; }
          .product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .product-card-img { height: 160px !important; }
          .product-card-info { padding: 10px 12px 14px !important; }
          .product-card-name { font-size: 13px !important; }
          .product-card-desc { font-size: 10px !important; min-height: 24px !important; margin-bottom: 6px !important; }
          .product-card-price { font-size: 15px !important; }
          .product-card-btn { padding: 9px 0 !important; font-size: 11px !important; border-radius: 8px !important; }
          .custom-card-hero { aspect-ratio: auto !important; padding: 24px 12px !important; }
          .custom-card-hero .custom-title { font-size: 18px !important; }
          .custom-card-info { padding: 12px !important; }
          .custom-card-info div { font-size: 13px !important; }
          .filter-section { gap: 6px !important; margin-bottom: 24px !important; }
          .filter-section button { padding: 8px 14px !important; font-size: 12px !important; }
          .product-section { padding: 32px 10px 48px !important; }
          .product-section .section-header { margin-bottom: 24px !important; }
          /* 행가도어/스윙도어 견적 카드 세로 배치 */
          .estimator-layout { flex-direction: column !important; }
          .estimator-card { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
        }
      `}</style>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, transition: "all 0.4s",
        background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(26,26,46,0.95)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Image src="/syc-logo.png" alt="SY" width={32} height={32} style={{ borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: scrolled ? "#1d1d1f" : "#f5f5f7", transition: "color 0.4s", whiteSpace: "nowrap" }}>SY Korea Panel</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(62,230,196,0.1)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(62,230,196,0.2)" }}>
              <Image src="/syc-logo.png" alt="SYC" width={18} height={18} style={{ borderRadius: "50%" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3ee6c4" }}>SYC 결제 가능</span>
            </div>
            {user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button onClick={() => setShowAuth(!showAuth)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: scrolled ? "#f5f5f7" : "rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: 20, border: "none", cursor: "pointer", transition: "all 0.3s" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hide-mobile" style={{ fontSize: 12, fontWeight: 700, color: scrolled ? "#1d1d1f" : "#f5f5f7", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.displayName || user.email?.split("@")[0] || "회원"}
                  </span>
                </button>
                {showAuth && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", padding: 8, minWidth: 180, zIndex: 100 }}>
                    <div style={{ padding: "10px 14px", fontSize: 12, color: "#86868b", borderBottom: "1px solid #f0f0f2" }}>
                      {user.displayName || user.email?.split("@")[0] || "회원"}
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{user.email || "이메일 없음"}</div>
                    </div>
                    <button onClick={() => { setShowAuth(false); setShowMyPage("info"); }}
                      style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1d1d1f", textAlign: "left", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      👤 회원정보
                    </button>
                    <button onClick={() => { setShowAuth(false); setShowMyPage("address"); }}
                      style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1d1d1f", textAlign: "left", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      📦 배송지 관리
                    </button>
                    <div style={{ height: 1, background: "#f0f0f2", margin: "4px 0" }} />
                    <button onClick={() => { signOut(); setShowAuth(false); }}
                      style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#e34040", textAlign: "left", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      🚪 로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ padding: "6px 12px", borderRadius: 20, border: scrolled ? "2px solid #e8e8ed" : "2px solid rgba(255,255,255,0.15)", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: scrolled ? "#1d1d1f" : "#f5f5f7", transition: "all 0.3s", whiteSpace: "nowrap" }}>
                로그인
              </button>
            )}
            <button onClick={() => setShowCart(!showCart)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, color: scrolled ? "#1d1d1f" : "#f5f5f7" }}>
              🛒
              {cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -8, background: "#7b5ea7", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO + SYC + TAB 통합 (시안 C) */}
      <section className="hero-section" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #12122a 100%)", padding: "clamp(36px,6vw,56px) clamp(20px,4vw,32px) clamp(28px,4vw,40px)", textAlign: "center", opacity: vis ? 1 : 0, transition: "opacity 0.8s" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 className="anim-fadeUp hero-title" style={{ fontSize: "clamp(24px, 5vw, 42px)", fontWeight: 800, color: "#f5f5f7", lineHeight: 1.25, letterSpacing: -1, marginBottom: "clamp(12px,2vw,16px)" }}>
            건축자재의 새로운 가치,<br /><span className="anim-shimmer">SY Korea Panel</span>
          </h1>
          <p className="anim-fadeUp-1 hero-sub" style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "#86868b", marginBottom: "clamp(20px,3vw,28px)" }}>
            후레싱 · 스윙도어 · 행가도어 — 제조부터 납품까지
          </p>

          {/* SYC 소개 페이지 배너 (시안B) */}
          <a href="/syc" className="anim-fadeUp-2 syc-banner" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            maxWidth: 600, margin: "0 auto 8px", padding: "16px 32px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(123,94,167,0.25), rgba(62,230,196,0.18))",
            border: "1px solid rgba(62,230,196,0.25)",
            textDecoration: "none", cursor: "pointer",
            transition: "all 0.3s ease",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(90deg, transparent, rgba(62,230,196,0.08), transparent)",
              animation: "bannerShimmer 3s ease-in-out infinite",
            }} />
            <Image src="/syc-logo.png" alt="SYC" width={32} height={32} style={{ borderRadius: "50%", flexShrink: 0, animation: "coinSpin 4s linear infinite", boxShadow: "0 0 20px rgba(123,94,167,0.5), 0 0 40px rgba(62,230,196,0.2)", border: "2px solid #1d1d1f" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f7" }}>
                SY Coin — 건축자재 × AI × 블록체인
              </div>
              <div style={{ fontSize: 12, color: "#3ee6c4", fontWeight: 600 }}>
                SYC 결제 시 5~10% 할인 · 코인 소개 보러가기 →
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* 카테고리 탭 (세그먼트 컨트롤) */}
      <div id="products" style={{ background: "#fff", padding: "16px 20px 8px", borderBottom: "1px solid #e8e8ed" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 4, background: "#f0f0f2", borderRadius: 14, padding: 4 }}>
          {([
            { id: "후레싱" as const, label: "후레싱",
              icon: (active: boolean) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5 L4 17 C4 18.1 4.9 19 6 19 L18 19 C19.1 19 20 18.1 20 17 L20 5" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            },
            { id: "행가도어" as const, label: "행가도어",
              icon: (active: boolean) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <line x1="3" y1="4" x2="21" y2="4" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="2.5" strokeLinecap="round"/>
                  <rect x="3" y="6" width="8" height="14" rx="1" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="1.8" fill="none"/>
                  <rect x="13" y="6" width="8" height="14" rx="1" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="1.8" fill="none"/>
                </svg>
              )
            },
            { id: "스윙도어" as const, label: "스윙도어",
              icon: (active: boolean) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="12" height="18" rx="1" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="1.8" fill="none"/>
                  <circle cx="14" cy="12" r="1.5" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="1.3" fill="none"/>
                  <line x1="14" y1="12" x2="17" y2="11" stroke={active ? "#7b5ea7" : "#9a9a9f"} strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              )
            },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)}
              style={{
                flex: 1, padding: "11px 6px", border: "none", cursor: "pointer",
                borderRadius: 11,
                background: mainTab === tab.id ? "#fff" : "transparent",
                boxShadow: mainTab === tab.id ? "0 1px 8px rgba(0,0,0,0.1)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "all 0.25s",
              }}>
              {tab.icon(mainTab === tab.id)}
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: mainTab === tab.id ? "#7b5ea7" : "#9a9a9f",
              }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 후레싱 탭 */}
      {mainTab === "후레싱" && (
      <section className="product-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: "#1d1d1f", letterSpacing: -0.8, marginBottom: 12 }}>후레싱 제품</h2>
          <p className="section-sub" style={{ fontSize: 15, color: "#86868b" }}>기성 {FLASHING_PRODUCTS.length}종 + 이형 맞춤 절곡 · 규격 · 색상 선택 후 주문</p>
          <div className="coil-banner" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, marginTop: 12, background: "#1a1a2e", padding: "8px 20px", borderRadius: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1c40f" }}>100% 국산 0.5T 코일만 사용</span>
            <span style={{ fontSize: 12, color: "#86868b" }}>(0.35T 중국산 저가 코일 절대 사용하지 않습니다)</span>
          </div>
          <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
            <input
              type="text" placeholder="제품명 검색 (예: 유바, 엘바, 물도이...)"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: 14, border: "2px solid #e8e8ed",
                fontSize: 14, outline: "none", background: "#fff", transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#7b5ea7"}
              onBlur={e => e.target.style.borderColor = "#e8e8ed"}
            />
          </div>
        </div>
        <div className="filter-section" style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {FLASHING_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "10px 22px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.3s",
              background: cat === c ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#fff",
              color: cat === c ? "#fff" : "#6e6e73",
              boxShadow: cat === c ? "0 4px 16px rgba(123,94,167,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
            }}>{c}</button>
          ))}
        </div>
        <div className="product-grid">
          {(cat === "전체" || cat === "이형") && (
            <div onClick={() => setShowCustom(true)} style={{ cursor: "pointer", borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "all 0.3s", border: "2px solid transparent" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(123,94,167,0.15)"; e.currentTarget.style.borderColor = "#7b5ea7"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "transparent"; }}>
              <div className="custom-card-hero" style={{ aspectRatio: "1", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 40%, #0a2540 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,94,167,0.3), transparent 70%)", top: "20%", left: "30%" }} />
                <div style={{ textAlign: "center", zIndex: 1, color: "#fff", padding: "0 16px" }}>
                  <div style={{ display: "inline-block", background: "rgba(227,64,64,0.9)", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 14, letterSpacing: 1 }}>🏆 업계 최초</div>
                  <div className="custom-title" style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.3 }}>내가 그린 절곡<br/>그대로 제작</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                    {[{icon:"✏️",label:"그리기"},{icon:"📐",label:"치수입력"},{icon:"💰",label:"즉시견적"}].map((s,i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ fontSize: 18 }}>{s.icon}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#3ee6c4", marginTop: 2 }}>{s.label}</div>
                        </div>
                        {i < 2 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="custom-card-info" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#e74c3c", letterSpacing: 1.5, marginBottom: 4 }}>🔥 업계최초</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>이형 후레싱 맞춤 주문</div>
                <div style={{ fontSize: 13, color: "#6e6e73", marginBottom: 12 }}>단면도 직접 그리고 바로 견적확인</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div><span style={{ fontSize: 12, color: "#86868b" }}>mm당 </span><span style={{ fontSize: 20, fontWeight: 800 }}>₩35~</span></div>
                  <div style={{ fontSize: 12, color: "#86868b" }}>7소재</div>
                </div>
                <div style={{ width: "100%", padding: "12px 0", borderRadius: 14, background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center" }}>주문하기</div>
              </div>
            </div>
          )}
          {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setDetail(p)} />)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#86868b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16 }}>검색 결과가 없습니다</div>
          </div>
        )}
      </section>
      )}

      {/* 행가도어 탭 */}
      {mainTab === "행가도어" && (
        <HangaDoorEstimator onAddCart={(item) => {
          addToCart({ ...item, category: "hanga" as const });
        }} />
      )}

      {/* 스윙도어 탭 */}
      {mainTab === "스윙도어" && (
        <SwingDoorEstimator onAddCart={(item) => {
          addToCart({ ...item, category: "swing" as const });
        }} />
      )}

      {/* GALLERY */}
      <section style={{ background: "#fff", padding: "60px 32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1f", textAlign: "center", marginBottom: 32 }}>제품 갤러리</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1", position: "relative" }}>
                <Image src={`/products/gallery_${i}.jpg`} alt={`갤러리 ${i}`} fill style={{ objectFit: "cover" }} sizes="200px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: "#f5f5f7", padding: "80px 32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1d1d1f", marginBottom: 16 }}>SY한국판넬</h2>
          <p style={{ fontSize: 16, color: "#6e6e73", lineHeight: 1.8, marginBottom: 40 }}>
            평택 소재 건축자재 전문기업으로, 후레싱 · 스윙도어 · 행가도어를 직접 생산하여 전국 현장에 납품하고 있습니다.
          </p>
          <div className="feature-grid">
            {[
              { icon: "🏭", title: "자체 제조", desc: "평택 공장에서 직접 생산" },
              { icon: "🚚", title: "전국 납품", desc: "빠른 배송 및 시공 지원" },
              { icon: "💰", title: "SYC 결제", desc: "코인 결제 시 추가 할인" },
              { icon: "⭐", title: "품질 보증", desc: "엄격한 품질 관리 시스템" },
            ].map((item, i) => (
              <div key={i} style={{ padding: 32, borderRadius: 20, background: "#fff", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1d1d1f", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#86868b" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a2e", padding: "48px 32px", color: "#86868b", fontSize: 13 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Image src="/syc-logo.png" alt="SYC" width={28} height={28} style={{ borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f7" }}>SY한국판넬</span>
              </div>
              <div style={{ lineHeight: 2 }}>경기도 평택시 삼봉로 77-9<br />사업자등록번호: 459-51-00067 | 통신판매업: 2019-경기송탄-0091<br />대표전화: 031-666-8404 | info@sykoreapanel.com</div>
            </div>
            <div style={{ display: "flex", gap: 40 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f7", marginBottom: 12 }}>제품</div>
                <div style={{ lineHeight: 2.2 }}>후레싱<br />스윙도어<br />행가도어</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f7", marginBottom: 12 }}>SYC 코인</div>
                <div style={{ lineHeight: 2.2 }}>
                  <a href="/syc" style={{ color: "inherit", textDecoration: "none" }}>코인 소개</a><br />
                  <a href="/syc#buy" style={{ color: "inherit", textDecoration: "none" }}>지갑 연결</a><br />
                  <a href="/syc#benefits" style={{ color: "inherit", textDecoration: "none" }}>할인 혜택</a><br />
                  <a href={`https://bscscan.com/token/0x6b2880CE191c790cA47329Dd761B07b71284785F`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>BSCscan ↗</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>© 2025 SY Korea Panel. All rights reserved.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Powered by</span>
              <Image src="/syc-logo.png" alt="SYC" width={16} height={16} style={{ borderRadius: "50%" }} />
              <span>SYC (BEP-20 on BSC)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CART */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} className="anim-slideIn" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(440px, 100vw)", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "clamp(14px,2vw,24px) clamp(16px,2.5vw,28px)", borderBottom: "1px solid #e8e8ed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 800 }}>장바구니 ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "#f5f5f7", border: "none", width: 32, height: 32, borderRadius: 16, fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: "clamp(12px,1.5vw,16px) clamp(16px,2.5vw,28px)", overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#86868b" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div><div>장바구니가 비어있어요</div>
                </div>
              ) : cart.map(item => (
                <div key={item.key} style={{ padding: "18px 0", borderBottom: "1px solid #f0f0f2" }}>
                  {item.image && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: 8, marginBottom: 10, border: "1px solid #e8e8ed" }}>
                      <img src={item.image} alt="절곡 도면" style={{ width: "100%", height: "auto", borderRadius: 8 }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", marginBottom: 3 }}>{item.productName}</div>
                    <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>{item.size} / {item.color}{item.colorSub ? ` (${item.colorSub})` : ""}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", background: "#f5f5f7", borderRadius: 10 }}>
                        <button onClick={() => updateQty(item.key, -1)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                        <input type="number" value={item.qty} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setItemQty(item.key, v); }}
                          onBlur={() => { if (item.qty < 1) setItemQty(item.key, 1); }}
                          style={{ width: 44, height: 28, textAlign: "center", fontSize: 14, fontWeight: 700, border: "2px solid #e8e8ed", borderRadius: 8, background: "#fff", outline: "none" }} min={1} />
                        <button onClick={() => updateQty(item.key, 1)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.key)} style={{ background: "none", border: "none", color: "#e34040", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>₩{(item.retailPrice * item.qty).toLocaleString()}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7b5ea7", marginTop: 2 }}>{Math.round(item.retailPrice * item.qty / 100).toLocaleString()} SYC</div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "clamp(14px,2vw,20px) clamp(16px,2.5vw,28px)", borderTop: "1px solid #e8e8ed", background: "#fafafa" }}>

                {/* 배송지 선택 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1d1d1f", marginBottom: 8 }}>배송지</div>
                  {savedAddresses.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {savedAddresses.map(a => (
                        <button key={a.id} onClick={() => selectAddr(a.id)}
                          style={{
                            padding: "10px 14px", borderRadius: 12, textAlign: "left",
                            border: selectedAddrId === a.id ? "2px solid #7b5ea7" : "2px solid #e8e8ed",
                            background: selectedAddrId === a.id ? "rgba(123,94,167,0.06)" : "#fff",
                            cursor: "pointer",
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: selectedAddrId === a.id ? "#7b5ea7" : "#1d1d1f" }}>📍 {a.label}</span>
                            {a.isDefault && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#7b5ea7", padding: "1px 6px", borderRadius: 6 }}>기본</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>{a.address1}</div>
                          {selectedAddrId === a.id && truckRegion && (
                            <div style={{ fontSize: 11, color: "#7b5ea7", fontWeight: 600, marginTop: 3 }}>→ 용차 지역: {truckRegion}</div>
                          )}
                          {selectedAddrId === a.id && !truckRegion && (
                            <div style={{ fontSize: 11, color: "#e34040", fontWeight: 600, marginTop: 3 }}>⚠️ 용차 배송지역 매칭 불가 — 문의 필요</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <div style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>등록된 배송지가 없어요</div>
                    </div>
                  )}
                  <button onClick={() => { setShowMyPage("address"); setShowCart(false); }}
                    style={{
                      width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 10,
                      border: "2px dashed #d0d0d5", background: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, color: "#7b5ea7",
                    }}>
                    {savedAddresses.length > 0 ? "＋ 배송지 추가/관리" : "＋ 배송지 등록하기"}
                  </button>
                </div>

                {/* 배송방법 선택 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1d1d1f", marginBottom: 8 }}>배송방법</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {([
                      { key: "self" as const, label: "🚗 자차방문", desc: "무료" },
                      { key: "parcel" as const, label: "📦 택배", desc: parcelFee === null ? "불가" : parcelFee === 0 ? "무료" : `₩${parcelFee.toLocaleString()}` },
                      { key: "truck" as const, label: "🚛 용차", desc: truckOptions.length > 0 && truckOptions[0].type !== "inquiry" ? `₩${truckOptions[selectedTruck]?.totalFee.toLocaleString() ?? "—"}` : truckRegion ? "문의" : "배송지 선택" },
                    ]).map(m => {
                      const disabled = (m.key === "parcel" && parcelFee === null) || (m.key === "truck" && !truckRegion);
                      const selected = delivery === m.key;
                      return (
                        <button key={m.key} onClick={() => !disabled && setDelivery(m.key)}
                          style={{
                            flex: 1, padding: "10px 6px", borderRadius: 12,
                            border: selected ? "2px solid #7b5ea7" : "2px solid #e8e8ed",
                            background: disabled ? "#f0f0f2" : selected ? "rgba(123,94,167,0.06)" : "#fff",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.5 : 1, textAlign: "center",
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: disabled ? "#aaa" : selected ? "#7b5ea7" : "#1d1d1f" }}>{m.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: disabled ? "#ccc" : m.key === "self" ? "#0f8a6c" : selected ? "#7b5ea7" : "#86868b", marginTop: 2 }}>{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 택배 안내 */}
                  {hasHanga && delivery !== "self" && delivery !== "truck" && (
                    <div style={{ fontSize: 11, color: "#e34040", fontWeight: 600, marginTop: 6 }}>
                      ⚠️ 행가도어 포함 시 택배 불가 (용차 또는 자차방문)
                    </div>
                  )}
                  {delivery === "parcel" && parcelFee !== null && parcelFee > 0 && (
                    <div style={{ fontSize: 11, color: "#86868b", marginTop: 6 }}>
                      후레싱 10개당 ₩25,000 · 스윙도어 편개 1조당 ₩30,000 (부가세별도)
                    </div>
                  )}

                  {/* 💡 배송 추천 팁 */}
                  {delivery === "parcel" && deliveryTip === "truck_cheaper" && cheapestTruck && (
                    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32", marginBottom: 4 }}>💡 용차가 더 저렴합니다!</div>
                      <div style={{ fontSize: 11, color: "#1b5e20", lineHeight: 1.6 }}>
                        택배비 ₩{parcelFee!.toLocaleString()} &gt; 용차 ₩{cheapestTruck.totalFee.toLocaleString()}
                        <br /><b>용차로 보내시면 됩니다.</b> 더 안전하고 더 저렴해요!
                      </div>
                    </div>
                  )}
                  {delivery === "parcel" && deliveryTip === "recommend_truck" && cheapestTruck && (
                    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "#fff8e1", border: "1px solid #ffe082" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e65100", marginBottom: 4 }}>💡 배송 추천</div>
                      <div style={{ fontSize: 11, color: "#6d4c00", lineHeight: 1.6 }}>
                        택배는 포장을 신경써서 보내드리고 있으나 파손의 위험이 있기 때문에 <b>용차를 추천</b>드립니다.
                      </div>
                    </div>
                  )}

                  {/* 용차 차량 옵션 */}
                  {delivery === "truck" && truckOptions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                      {truckOptions.map((opt, idx) => (
                        <button key={idx} onClick={() => opt.type !== "inquiry" && setSelectedTruck(idx)}
                          style={{
                            padding: "12px 14px", borderRadius: 12, textAlign: "left",
                            border: opt.type === "inquiry" ? "2px solid #fde8e8" : selectedTruck === idx ? "2px solid #7b5ea7" : "2px solid #e8e8ed",
                            background: opt.type === "inquiry" ? "#fef2f2" : selectedTruck === idx ? "rgba(123,94,167,0.06)" : "#fff",
                            cursor: opt.type === "inquiry" ? "default" : "pointer",
                          }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: opt.type === "inquiry" ? "#e34040" : "#1d1d1f" }}>{opt.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: opt.type === "inquiry" ? "#e34040" : "#7b5ea7" }}>
                              {opt.type === "inquiry" ? "문의 필요" : `₩${opt.totalFee.toLocaleString()}`}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>{opt.desc}</div>
                        </button>
                      ))}

                      {/* 🚛 조합 차량 팁 */}
                      {comboTip && (
                        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#e3f2fd", border: "1px solid #90caf9", marginTop: 2 }}>
                          <div style={{ fontSize: 11, color: "#1565c0", lineHeight: 1.6 }}>
                            💬 적재량 초과로 차량이 추가되었어요. 소량의 추가 물량은 인력으로 더 실을 수도 있으니, <b>문의하기</b>를 통해 사장님과 상의해보시는 건 어떨까요?
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 결제방식 */}
                <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", background: "#e8e8ed", marginBottom: 16 }}>
                  {[{ key: "krw", label: "₩ 원화 결제" }, { key: "syc", label: "SYC 코인 결제" }].map(m => (
                    <button key={m.key} onClick={() => setPay(m.key)} style={{
                      flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                      background: pay === m.key ? (m.key === "syc" ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f") : "transparent",
                      color: pay === m.key ? "#fff" : "#6e6e73", borderRadius: pay === m.key ? 10 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      {m.key === "syc" && <Image src="/syc-logo.png" alt="" width={16} height={16} style={{ borderRadius: "50%" }} />}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* 금액 상세 */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#6e6e73" }}>
                  <span>상품 소계</span>
                  <span>{pay === "syc" ? `${cartSycRealtime.toLocaleString()} SYC` : `₩${cartTotal.toLocaleString()}`}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#6e6e73" }}>
                  <span>배송비{delivery === "truck" && truckRegion ? ` (${truckRegion})` : ""}</span>
                  <span style={{ color: deliveryFee === 0 ? "#0f8a6c" : "#1d1d1f", fontWeight: 600 }}>
                    {deliveryFee === 0 ? "무료" : (pay === "syc" ? `${deliverySycRealtime.toLocaleString()} SYC` : `₩${deliveryFee.toLocaleString()}`)}
                  </span>
                </div>
                {pay === "syc" && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#3ee6c4", fontWeight: 600 }}>
                    <span>SYC 할인 (10%)</span><span>-{sycDiscount.toLocaleString()} SYC</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "#6e6e73", padding: "8px 0", borderTop: "1px solid #e8e8ed" }}>
                  <span>공급가액</span>
                  <span>₩{(cartTotal + deliveryFee).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#86868b" }}>
                  <span>부가세 (10%)</span>
                  <span>₩{Math.floor((cartTotal + deliveryFee) * 0.1).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 800, color: "#1d1d1f", padding: "10px 0", borderTop: "2px solid #1d1d1f", marginTop: 4 }}>
                  <span>총 결제금액</span>
                  <span style={{ color: pay === "syc" ? "#7b5ea7" : "#1d1d1f" }}>
                    {pay === "syc"
                      ? `${sycFinalTotal.toLocaleString()} SYC`
                      : `₩${Math.floor((cartTotal + deliveryFee) * 1.1).toLocaleString()}`}
                  </span>
                </div>
                {/* SYC 시세 정보 + 지갑 상태 */}
                {pay === "syc" && (
                  <div style={{ background: "linear-gradient(135deg, rgba(123,94,167,0.08), rgba(62,230,196,0.08))", borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 4 }}>
                    {sycPriceLoading ? (
                      <div style={{ fontSize: 12, color: "#86868b", textAlign: "center" }}>⏳ SYC 시세 조회 중...</div>
                    ) : sycPrice ? (
                      <div style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.8 }}>
                        <div>📊 <b style={{ color: "#7b5ea7" }}>1 SYC ≈ ₩{sycPrice.krwPerSyc < 1 ? sycPrice.krwPerSyc.toFixed(4) : sycPrice.krwPerSyc.toFixed(2)}</b> <span style={{ color: "#86868b" }}>(PancakeSwap 실시간)</span></div>
                        <div>🔗 1 BNB = {sycPrice.sycPerBnb.toLocaleString(undefined, { maximumFractionDigits: 0 })} SYC</div>
                        {wallet ? (
                          <div style={{ marginTop: 6, padding: "8px 0", borderTop: "1px solid rgba(123,94,167,0.15)" }}>
                            <div>👛 지갑: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
                            <div>💰 SYC 잔액: <b style={{ color: wallet.sycBalance >= sycFinalTotal ? "#3ee6c4" : "#ff6b6b" }}>{Math.floor(wallet.sycBalance).toLocaleString()} SYC</b>
                              {wallet.sycBalance < sycFinalTotal && <span style={{ color: "#ff6b6b", fontSize: 11 }}> (잔액 부족)</span>}
                            </div>
                            <div>⛽ BNB (가스비): {wallet.bnbBalance.toFixed(4)} BNB</div>
                          </div>
                        ) : (
                          <div style={{ marginTop: 6, fontSize: 11, color: "#86868b" }}>💡 아래 버튼을 눌러 메타마스크 지갑을 연결해주세요</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#86868b" }}>
                        {isMetaMaskInstalled()
                          ? "💡 지갑을 연결하면 실시간 SYC 시세를 확인할 수 있어요"
                          : "⚠️ 메타마스크가 필요합니다. MetaMask 앱 내 브라우저에서 접속해주세요."}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={handlePayment} disabled={paymentLoading} style={{
                  width: "100%", padding: "clamp(12px,2vw,16px) 0", border: "none", borderRadius: 14,
                  background: pay === "syc" ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f",
                  color: "#fff", fontSize: "clamp(13px,2vw,16px)", fontWeight: 800, cursor: paymentLoading ? "wait" : "pointer", marginTop: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: paymentLoading ? 0.6 : 1, transition: "opacity 0.2s",
                }}>
                  {paymentLoading ? "⏳ 결제 처리 중..." : (
                    <>
                      {pay === "syc" && <Image src="/syc-logo.png" alt="" width={20} height={20} style={{ borderRadius: "50%" }} />}
                      {pay === "syc"
                        ? (wallet ? `${sycFinalTotal.toLocaleString()} SYC 결제하기` : (walletConnecting ? "⏳ 지갑 연결 중..." : "🦊 메타마스크 지갑 연결"))
                        : "💳 결제하기"}
                    </>
                  )}
                </button>
                <button onClick={async () => {
                  const items = cart.map(i => `• ${i.productName} (${i.size}/${i.color}) x${i.qty} = ₩${(i.retailPrice * i.qty).toLocaleString()}`).join("\n");
                  const msg = `[SY한국판넬 주문문의]\n\n${items}\n\n합계: ₩${cartTotal.toLocaleString()} (부가세별도)\n\n배송/결제 상담 부탁드립니다.`;
                  try { await navigator.clipboard.writeText(msg); } catch { /* fallback */ }
                  alert("장바구니 내용이 복사되었습니다!\n카톡 채팅창에 붙여넣기(Ctrl+V) 해주세요.");
                  window.open("http://pf.kakao.com/_vDxfmn/chat", "_blank");
                }} style={{
                  width: "100%", padding: "clamp(10px,1.8vw,14px) 0", border: "2px solid #FAE100", borderRadius: 14,
                  background: "#FAE100", color: "#3C1E1E", fontSize: "clamp(13px,1.8vw,15px)", fontWeight: 800, cursor: "pointer", marginTop: 8,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  💬 카톡으로 주문 문의
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onAddCart={addToCart} />}
      {showCustom && <CustomFlashingModal onClose={() => setShowCustom(false)} onAddCart={(item) => { addToCart(item); setShowCustom(false); }} />}
      {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />}
      {showMyPage && user && <MyPageModal user={user} initialTab={showMyPage} onClose={() => setShowMyPage(false)} />}

      {/* 플로팅 카톡 문의 버튼 */}
      <a href="http://pf.kakao.com/_vDxfmn/chat" target="_blank" rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 150,
          width: 56, height: 56, borderRadius: 28,
          background: "#FAE100", color: "#3C1E1E",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          textDecoration: "none", fontSize: 28,
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        💬
      </a>

      {/* 장바구니 추가 확인 모달 */}
      {cartAddedItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCartAddedItem(null)}>
          <div onClick={e => e.stopPropagation()} className="anim-slideIn" style={{
            background: "#fff", borderRadius: 20, padding: "36px 28px", width: "min(360px, 88vw)",
            textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1d1d1f", marginBottom: 6 }}>장바구니에 담았습니다!</div>
            <div style={{ fontSize: 14, color: "#86868b", marginBottom: 24 }}>{cartAddedItem}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCartAddedItem(null)} style={{
                flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #e8e8ed",
                background: "#fff", fontSize: 14, fontWeight: 700, color: "#1d1d1f", cursor: "pointer",
              }}>계속 쇼핑하기</button>
              <button onClick={() => { setCartAddedItem(null); setShowCart(true); }} style={{
                flex: 1, padding: "14px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #7b5ea7, #9b59b6)", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>장바구니 보기</button>
            </div>
          </div>
        </div>
      )}

      {/* 결제 완료 모달 */}
      {orderComplete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="anim-slideIn" style={{
            background: "#fff", borderRadius: 24, padding: "40px 32px", width: "min(400px, 90vw)",
            textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1d1d1f", marginBottom: 8 }}>결제가 완료되었습니다!</div>
            <div style={{ fontSize: 14, color: "#86868b", marginBottom: 8 }}>주문번호: {orderComplete.paymentId}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#7b5ea7", marginBottom: 24 }}>
              ₩{orderComplete.totalAmount.toLocaleString()}
            </div>

            <div style={{ background: "#f5f5f7", borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>안내사항</div>
              <div style={{ fontSize: 13, color: "#1d1d1f", lineHeight: 1.8 }}>
                · 주문 확인 후 제작/배송이 시작됩니다.<br />
                · 문의사항은 카톡 채널로 연락주세요.<br />
                · 대표전화: 031-666-8404
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {orderComplete.receiptUrl && (
                <button onClick={() => window.open(orderComplete.receiptUrl, "_blank")} style={{
                  flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #e8e8ed",
                  background: "#fff", fontSize: 14, fontWeight: 700, color: "#1d1d1f", cursor: "pointer",
                }}>🧾 영수증</button>
              )}
              <button onClick={() => setOrderComplete(null)} style={{
                flex: 1, padding: "14px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
