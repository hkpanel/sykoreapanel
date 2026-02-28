"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Product {
  id: number; name: string; category: string; price: number;
  sycPrice: number; image: string; desc: string; badge: string | null;
}
interface CartItem extends Product { qty: number; }

const PRODUCTS: Product[] = [
  { id: 1, name: "스윙도어 SD-100", category: "스윙도어", price: 185000, sycPrice: 1850, image: "🚪", desc: "스탠다드 스윙도어 / 900×2100", badge: "BEST" },
  { id: 2, name: "행가도어 HD-200", category: "행가도어", price: 245000, sycPrice: 2450, image: "🚪", desc: "슬라이딩 행가도어 / 1200×2100", badge: "NEW" },
  { id: 3, name: "조립식판넬 CP-50", category: "조립식판넬", price: 32000, sycPrice: 320, image: "🏗️", desc: "EPS 샌드위치판넬 / T50", badge: null },
  { id: 4, name: "후레싱 FL-A1", category: "후레싱", price: 8500, sycPrice: 85, image: "🔩", desc: "칼라강판 후레싱 / 0.5T", badge: null },
  { id: 5, name: "스윙도어 SD-200P", category: "스윙도어", price: 320000, sycPrice: 3200, image: "🚪", desc: "프리미엄 방화 스윙도어", badge: "PREMIUM" },
  { id: 6, name: "조립식판넬 CP-75", category: "조립식판넬", price: 45000, sycPrice: 450, image: "🏗️", desc: "우레탄 샌드위치판넬 / T75", badge: "HOT" },
];
const CATEGORIES = ["전체", "스윙도어", "행가도어", "조립식판넬", "후레싱"];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = value / 75;
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(n));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const [h, setH] = useState(false);
  const bc: Record<string, string> = { NEW: "#3ee6c4", BEST: "#1d1d1f", PREMIUM: "#7b5ea7", HOT: "#e34040" };
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer", position: "relative",
        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
        transform: h ? "translateY(-8px)" : "translateY(0)",
        boxShadow: h ? "0 24px 48px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
      }}>
      {product.badge && (
        <div style={{
          position: "absolute", top: 16, left: 16, zIndex: 2, fontSize: 11, fontWeight: 700,
          letterSpacing: 1, padding: "5px 12px", borderRadius: 20,
          background: bc[product.badge] || "#1d1d1f",
          color: product.badge === "NEW" ? "#1a1a2e" : "#fff",
        }}>{product.badge}</div>
      )}
      <div style={{
        height: 220, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #f5f5f7, #e8e8ed)", fontSize: 72,
        transition: "transform 0.4s", transform: h ? "scale(1.05)" : "scale(1)",
      }}>{product.image}</div>
      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
          {product.category}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: "#86868b", marginBottom: 16, lineHeight: 1.5 }}>{product.desc}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1d1d1f" }}>₩{product.price.toLocaleString()}</span>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#7b5ea7", background: "rgba(123,94,167,0.08)",
            padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            <Image src="/syc-logo.png" alt="SYC" width={14} height={14} style={{ borderRadius: "50%" }} />
            {product.sycPrice.toLocaleString()} SYC
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          style={{
            width: "100%", padding: "13px 0", border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.3s",
            background: h ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f",
          }}>장바구니 담기</button>
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

  useEffect(() => {
    setVis(true);
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const filtered = cat === "전체" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: number, d: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartSyc = cart.reduce((s, i) => s + i.sycPrice * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>

      {/* ─── NAV ─── */}
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
            <div style={{
              display: "flex", alignItems: "center", gap: 6, background: "rgba(62,230,196,0.1)",
              padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(62,230,196,0.2)",
            }}>
              <Image src="/syc-logo.png" alt="SYC" width={18} height={18} style={{ borderRadius: "50%" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3ee6c4" }}>SYC 결제 가능</span>
            </div>
            <button onClick={() => setShowCart(!showCart)} style={{
              position: "relative", background: "none", border: "none", cursor: "pointer",
              fontSize: 20, padding: 4, color: scrolled ? "#1d1d1f" : "#f5f5f7",
            }}>
              🛒
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8, background: "#7b5ea7", color: "#fff",
                  fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #12122a 100%)",
        padding: "80px 32px 60px", textAlign: "center",
        opacity: vis ? 1 : 0, transition: "opacity 0.8s",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="anim-fadeUp" style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700,
            color: "#3ee6c4", background: "rgba(62,230,196,0.08)", border: "1px solid rgba(62,230,196,0.15)",
            padding: "8px 18px", borderRadius: 24, marginBottom: 28,
          }}>
            <Image src="/syc-logo.png" alt="SYC" width={20} height={20} style={{ borderRadius: "50%" }} className="anim-float" />
            SYC 코인으로 결제하면 최대 10% 할인
          </div>
          <h1 className="anim-fadeUp-1" style={{
            fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "#f5f5f7",
            lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 16,
          }}>
            건축의 시작,<br />
            <span className="anim-shimmer">SY Korea Panel</span>
          </h1>
          <p className="anim-fadeUp-2" style={{ fontSize: 17, color: "#86868b", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 36px" }}>
            스윙도어 · 행가도어 · 조립식판넬 · 후레싱<br />
            제조부터 납품까지, 대한민국 건축자재 전문기업
          </p>
          <div className="anim-fadeUp-3" style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="#products" style={{
              padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)",
              color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
            }}>제품 보기</a>
            <a href="#about" style={{
              padding: "14px 32px", borderRadius: 12, color: "#f5f5f7", fontSize: 15, fontWeight: 700,
              textDecoration: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            }}>회사 소개</a>
          </div>
        </div>
        <div className="anim-fadeUp-4" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 56, flexWrap: "wrap" }}>
          {[
            { label: "제조 경력", value: 15, suffix: "년+" },
            { label: "납품 현장", value: 2400, suffix: "+" },
            { label: "등록 제품", value: 85, suffix: "종" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#f5f5f7" }}><AnimatedNumber value={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: 13, color: "#86868b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SYC BANNER ─── */}
      <section style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f1b3d 50%, #0a2540 100%)",
        padding: "40px 32px", borderTop: "1px solid rgba(62,230,196,0.08)", borderBottom: "1px solid rgba(62,230,196,0.08)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", boxShadow: "0 0 30px rgba(123,94,167,0.3)" }}>
              <Image src="/syc-logo.png" alt="SYC" width={56} height={56} style={{ borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f5f5f7" }}>SYC 코인 결제 지원</div>
              <div style={{ fontSize: 13, color: "#86868b", marginTop: 2 }}>BSC (BEP-20) · MetaMask · Trust Wallet 연동</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["코인 결제 시 5~10% 할인", "구매 시 SYC 리워드 적립", "VIP 홀더 우선 납품"].map((t, i) => (
              <div key={i} style={{
                padding: "8px 16px", borderRadius: 10, background: "rgba(62,230,196,0.06)",
                border: "1px solid rgba(62,230,196,0.12)", fontSize: 12, fontWeight: 600, color: "#3ee6c4",
              }}>✦ {t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section id="products" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1d1d1f", letterSpacing: -0.8, marginBottom: 12 }}>제품 카탈로그</h2>
          <p style={{ fontSize: 15, color: "#86868b" }}>SY한국판넬의 전 제품을 만나보세요</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "10px 22px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, transition: "all 0.3s",
              background: cat === c ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#fff",
              color: cat === c ? "#fff" : "#6e6e73",
              boxShadow: cat === c ? "0 4px 16px rgba(123,94,167,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
            }}>{c}</button>
          ))}
        </div>
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ background: "#fff", padding: "80px 32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1d1d1f", marginBottom: 16 }}>SY한국판넬</h2>
          <p style={{ fontSize: 16, color: "#6e6e73", lineHeight: 1.8, marginBottom: 40 }}>
            평택 소재 건축자재 제조 전문기업으로, 조립식판넬 · 스윙도어 · 행가도어 · 후레싱을
            직접 생산하여 전국 현장에 납품하고 있습니다.
          </p>
          <div className="feature-grid">
            {[
              { icon: "🏭", title: "자체 제조", desc: "평택 공장에서 직접 생산" },
              { icon: "🚚", title: "전국 납품", desc: "빠른 배송 및 시공 지원" },
              { icon: "💰", title: "SYC 결제", desc: "코인 결제 시 추가 할인" },
              { icon: "⭐", title: "품질 보증", desc: "엄격한 품질 관리 시스템" },
            ].map((item, i) => (
              <div key={i} style={{ padding: 32, borderRadius: 20, background: "#f5f5f7", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1d1d1f", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#86868b" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#1a1a2e", padding: "48px 32px", color: "#86868b", fontSize: 13 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Image src="/syc-logo.png" alt="SYC" width={28} height={28} style={{ borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f7" }}>SY한국판넬</span>
              </div>
              <div style={{ lineHeight: 2 }}>
                경기도 평택시 | 사업자등록번호: XXX-XX-XXXXX<br />
                대표전화: 031-XXX-XXXX | info@sykoreapanel.com
              </div>
            </div>
            <div style={{ display: "flex", gap: 40 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f7", marginBottom: 12 }}>제품</div>
                <div style={{ lineHeight: 2.2 }}>스윙도어<br />행가도어<br />조립식판넬<br />후레싱</div>
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

      {/* ─── CART ─── */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} className="anim-slideIn" style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 90vw)",
            background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e8e8ed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1d1d1f" }}>장바구니 ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "#f5f5f7", border: "none", width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: "16px 28px", overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#86868b" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                  <div>장바구니가 비어있어요</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: "1px solid #f0f0f2", alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.image}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>{item.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", background: "#f5f5f7", borderRadius: 10 }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>−</button>
                        <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 700 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#e34040", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>₩{(item.price * item.qty).toLocaleString()}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7b5ea7", marginTop: 2, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                      <Image src="/syc-logo.png" alt="" width={12} height={12} style={{ borderRadius: "50%" }} />
                      {(item.sycPrice * item.qty).toLocaleString()} SYC
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "20px 28px", borderTop: "1px solid #e8e8ed", background: "#fafafa" }}>
                <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", background: "#e8e8ed", marginBottom: 16 }}>
                  {[
                    { key: "krw", label: "₩ 원화 결제" },
                    { key: "syc", label: "SYC 코인 결제" },
                  ].map(m => (
                    <button key={m.key} onClick={() => setPay(m.key)} style={{
                      flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                      background: pay === m.key ? (m.key === "syc" ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "#1d1d1f") : "transparent",
                      color: pay === m.key ? "#fff" : "#6e6e73",
                      borderRadius: pay === m.key ? 10 : 0,
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
                    <span>SYC 할인 (10%)</span>
                    <span>-{Math.floor(cartSyc * 0.1).toLocaleString()} SYC</span>
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
                  boxShadow: pay === "syc" ? "0 4px 20px rgba(123,94,167,0.3)" : "0 4px 20px rgba(0,0,0,0.15)",
                }}>
                  {pay === "syc" && <Image src="/syc-logo.png" alt="" width={20} height={20} style={{ borderRadius: "50%" }} />}
                  {pay === "syc" ? "지갑 연결 후 결제" : "💳 결제하기"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
