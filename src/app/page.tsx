"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FLASHING_PRODUCTS, FLASHING_CATEGORIES, COLOR_DETAILS,
  getRetailPrice, getMinRetailPrice,
  type FlashingProduct,
} from "./data/flashingProducts";

interface CartItem {
  key: string; productId: string; productName: string;
  size: string; color: string; colorSub?: string;
  retailPrice: number; qty: number;
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
      <div style={{
        height: 220, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #f5f5f7, #e8e8ed)", overflow: "hidden",
        transition: "transform 0.4s", transform: h ? "scale(1.05)" : "scale(1)",
      }}>
        <Image src={product.image} alt={product.name} width={200} height={200}
          style={{ objectFit: "contain", width: "70%", height: "70%" }} />
      </div>
      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
          {product.category}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: "#86868b", marginBottom: 16, lineHeight: 1.5, minHeight: 40 }}>{product.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 13, color: "#86868b" }}>최저 </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#1d1d1f" }}>₩{minPrice.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 12, color: "#86868b" }}>
            {product.sizes.length}규격 · {product.availableColors.reduce((sum, c) => {
              const ci = COLOR_DETAILS[c];
              return sum + (ci?.subColors ? ci.subColors.length : 1);
            }, 0)}색상
          </div>
        </div>
        <button style={{
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
              <span style={{ width: 40, textAlign: "center", fontSize: 16, fontWeight: 700 }}>{qty}</span>
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

export default function Home() {
  const [cat, setCat] = useState("전체");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [vis, setVis] = useState(false);
  const [pay, setPay] = useState("krw");
  const [detail, setDetail] = useState<FlashingProduct | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setVis(true);
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const filtered = FLASHING_PRODUCTS.filter(p => {
    const catMatch = cat === "전체" || p.category === cat;
    const searchMatch = !search || p.name.includes(search) || p.desc.includes(search) || p.id.includes(search.toLowerCase());
    return catMatch && searchMatch;
  });
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const ex = prev.find(i => i.key === item.key);
      if (ex) return prev.map(i => i.key === item.key ? { ...i, qty: i.qty + item.qty } : i);
      return [...prev, item];
    });
  };
  const removeFromCart = (key: string) => setCart(prev => prev.filter(i => i.key !== key));
  const updateQty = (key: string, d: number) => setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.retailPrice * i.qty, 0);
  const cartSyc = Math.round(cartTotal / 100);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, transition: "all 0.4s",
        background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(26,26,46,0.95)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/syc-logo.png" alt="SY" width={32} height={32} style={{ borderRadius: "50%" }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: scrolled ? "#1d1d1f" : "#f5f5f7", transition: "color 0.4s" }}>SY Korea Panel</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(62,230,196,0.1)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(62,230,196,0.2)" }}>
              <Image src="/syc-logo.png" alt="SYC" width={18} height={18} style={{ borderRadius: "50%" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3ee6c4" }}>SYC 결제 가능</span>
            </div>
            <button onClick={() => setShowCart(!showCart)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, color: scrolled ? "#1d1d1f" : "#f5f5f7" }}>
              🛒
              {cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -8, background: "#7b5ea7", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #12122a 100%)", padding: "80px 32px 60px", textAlign: "center", opacity: vis ? 1 : 0, transition: "opacity 0.8s" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="anim-fadeUp" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#3ee6c4", background: "rgba(62,230,196,0.08)", border: "1px solid rgba(62,230,196,0.15)", padding: "8px 18px", borderRadius: 24, marginBottom: 28 }}>
            <Image src="/syc-logo.png" alt="SYC" width={20} height={20} style={{ borderRadius: "50%" }} className="anim-float" />
            SYC 코인으로 결제하면 최대 10% 할인
          </div>
          <h1 className="anim-fadeUp-1" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "#f5f5f7", lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 16 }}>
            건축의 시작,<br /><span className="anim-shimmer">SY Korea Panel</span>
          </h1>
          <p className="anim-fadeUp-2" style={{ fontSize: 17, color: "#86868b", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 36px" }}>
            스윙도어 · 행가도어 · 조립식판넬 · 후레싱<br />제조부터 납품까지, 대한민국 건축자재 전문기업
          </p>
          <div className="anim-fadeUp-3" style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="#products" style={{ padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>제품 보기</a>
            <a href="#about" style={{ padding: "14px 32px", borderRadius: 12, color: "#f5f5f7", fontSize: 15, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>회사 소개</a>
          </div>
        </div>
        <div className="anim-fadeUp-4" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 56, flexWrap: "wrap" }}>
          {[{ label: "제조 경력", value: 15, suffix: "년+" }, { label: "납품 현장", value: 2400, suffix: "+" }, { label: "등록 제품", value: 85, suffix: "종" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#f5f5f7" }}><AnimatedNumber value={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: 13, color: "#86868b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SYC BANNER */}
      <section style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f1b3d 50%, #0a2540 100%)", padding: "40px 32px", borderTop: "1px solid rgba(62,230,196,0.08)", borderBottom: "1px solid rgba(62,230,196,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Image src="/syc-logo.png" alt="SYC" width={56} height={56} style={{ borderRadius: "50%", boxShadow: "0 0 30px rgba(123,94,167,0.3)" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f5f5f7" }}>SYC 코인 결제 지원</div>
              <div style={{ fontSize: 13, color: "#86868b", marginTop: 2 }}>BSC (BEP-20) · MetaMask · Trust Wallet 연동</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["코인 결제 시 5~10% 할인", "구매 시 SYC 리워드 적립", "VIP 홀더 우선 납품"].map((t, i) => (
              <div key={i} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(62,230,196,0.06)", border: "1px solid rgba(62,230,196,0.12)", fontSize: 12, fontWeight: 600, color: "#3ee6c4" }}>✦ {t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1d1d1f", letterSpacing: -0.8, marginBottom: 12 }}>후레싱 제품</h2>
          <p style={{ fontSize: 15, color: "#86868b" }}>기성 후레싱 {FLASHING_PRODUCTS.length}종 · 규격 · 색상 선택 후 주문</p>
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
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
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
          {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setDetail(p)} />)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#86868b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16 }}>검색 결과가 없습니다</div>
          </div>
        )}
      </section>

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
            평택 소재 건축자재 제조 전문기업으로, 조립식판넬 · 스윙도어 · 행가도어 · 후레싱을 직접 생산하여 전국 현장에 납품하고 있습니다.
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
              <div style={{ lineHeight: 2 }}>경기도 평택시 | 사업자등록번호: XXX-XX-XXXXX<br />대표전화: 031-XXX-XXXX | info@sykoreapanel.com</div>
            </div>
            <div style={{ display: "flex", gap: 40 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f7", marginBottom: 12 }}>제품</div>
                <div style={{ lineHeight: 2.2 }}>후레싱<br />스윙도어<br />행가도어<br />조립식판넬</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f7", marginBottom: 12 }}>SYC 코인</div>
                <div style={{ lineHeight: 2.2 }}>코인 소개<br />지갑 연결<br />할인 혜택<br />BSCscan</div>
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
          <div onClick={e => e.stopPropagation()} className="anim-slideIn" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(440px, 92vw)", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e8e8ed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>장바구니 ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "#f5f5f7", border: "none", width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: "16px 28px", overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#86868b" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div><div>장바구니가 비어있어요</div>
                </div>
              ) : cart.map(item => (
                <div key={item.key} style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid #f0f0f2", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", marginBottom: 3 }}>{item.productName}</div>
                    <div style={{ fontSize: 12, color: "#86868b", marginBottom: 6 }}>{item.size} / {item.color}{item.colorSub ? ` (${item.colorSub})` : ""}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", background: "#f5f5f7", borderRadius: 10 }}>
                        <button onClick={() => updateQty(item.key, -1)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                        <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 700 }}>{item.qty}</span>
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
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "20px 28px", borderTop: "1px solid #e8e8ed", background: "#fafafa" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#6e6e73" }}>
                  <span>소계</span>
                  <span>{pay === "syc" ? `${cartSyc.toLocaleString()} SYC` : `₩${cartTotal.toLocaleString()}`}</span>
                </div>
                {pay === "syc" && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#3ee6c4", fontWeight: 600 }}>
                    <span>SYC 할인 (10%)</span><span>-{Math.floor(cartSyc * 0.1).toLocaleString()} SYC</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "#1d1d1f", padding: "12px 0", borderTop: "1px solid #e8e8ed", marginTop: 8 }}>
                  <span>합계</span>
                  <span style={{ color: pay === "syc" ? "#7b5ea7" : "#1d1d1f" }}>
                    {pay === "syc" ? `${Math.floor(cartSyc * 0.9).toLocaleString()} SYC` : `₩${cartTotal.toLocaleString()}`}
                  </span>
                </div>
                <button style={{
                  width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
                  background: pay === "syc" ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f",
                  color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {pay === "syc" && <Image src="/syc-logo.png" alt="" width={20} height={20} style={{ borderRadius: "50%" }} />}
                  {pay === "syc" ? "지갑 연결 후 결제" : "💳 결제하기"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onAddCart={addToCart} />}
    </div>
  );
}
