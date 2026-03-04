"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// ═══════════════════════════════════════
//  SYC 실시간 시세 (PancakeSwap)
// ═══════════════════════════════════════
function useSycPrice() {
  const [price, setPrice] = useState<{ krw: number; usd: number; sycPerBnb: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        // BNB 시세
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=krw,usd");
        const data = await res.json();
        const bnbKrw = data.binancecoin?.krw || 800000;
        const bnbUsd = data.binancecoin?.usd || 620;
        // 유동성풀 기준 (500만 SYC / 2 BNB → 1 BNB = 2,500,000 SYC)
        const sycPerBnb = 2500000;
        const krwPerSyc = bnbKrw / sycPerBnb;
        const usdPerSyc = bnbUsd / sycPerBnb;
        setPrice({ krw: krwPerSyc, usd: usdPerSyc, sycPerBnb });
      } catch {
        setPrice({ krw: 0.32, usd: 0.00025, sycPerBnb: 2500000 });
      } finally {
        setLoading(false);
      }
    }
    fetchPrice();
  }, []);

  return { price, loading };
}

// ═══════════════════════════════════════
//  애니메이션 카운터
// ═══════════════════════════════════════
function AnimNum({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = value / 60;
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setD(value); clearInterval(t); } else setD(Math.floor(n));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{prefix}{d.toLocaleString()}{suffix}</span>;
}

// ═══════════════════════════════════════
//  메인 페이지
// ═══════════════════════════════════════
export default function SycPage() {
  const { price, loading } = useSycPrice();
  const [vis, setVis] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setVis(true);
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const CONTRACT = "0x6b2880CE191c790cA47329Dd761B07b71284785F";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f5f5f7", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, #7b5ea7, #3ee6c4, transparent); margin: 0 auto; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(123,94,167,0.15); }
        .step-card { transition: all 0.4s ease; }
        .step-active { border-color: #3ee6c4 !important; background: linear-gradient(135deg, rgba(123,94,167,0.1), rgba(62,230,196,0.08)) !important; }
        .ticker { display: inline-block; animation: pulse 2s ease-in-out infinite; }
        .hero-bg { 
          background: radial-gradient(ellipse at 30% 20%, rgba(123,94,167,0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 60%, rgba(62,230,196,0.1) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(10,10,15,1) 0%, #0a0a0f 100%);
        }
        .gradient-text {
          background: linear-gradient(135deg, #7b5ea7, #3ee6c4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .section-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 768px) {
          /* 히어로 컴팩트 */
          .hero-section-syc { min-height: auto !important; padding: 80px 16px 32px !important; }
          .hero-logo-wrap { margin-bottom: 16px !important; }
          .hero-logo-wrap img { width: 56px !important; height: 56px !important; }
          .hero-bep { font-size: 10px !important; letter-spacing: 2px !important; margin-bottom: 8px !important; }
          .hero-title { font-size: 24px !important; margin-bottom: 10px !important; }
          .hero-sub { font-size: 13px !important; margin: 0 auto 16px !important; line-height: 1.6 !important; }
          .hero-price-card { padding: 10px 12px !important; margin-bottom: 16px !important; gap: 8px !important; }
          .hero-price-card > div:nth-child(2), .hero-price-card > div:nth-child(4) { display: none !important; }
          .hero-cta-wrap { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
          .hero-cta-wrap a { justify-content: center !important; padding: 11px 16px !important; font-size: 13px !important; }
          /* 섹션 패딩 대폭 축소 */
          .syc-section { padding: 36px 14px !important; }
          .section-container { padding: 0 10px !important; }
          /* 섹션 타이틀 축소 */
          .section-title { font-size: 20px !important; margin-bottom: 8px !important; }
          /* 섹션 내 모든 텍스트 축소 */
          .syc-section p, .syc-section span { font-size: 12px !important; }
          .syc-section h3 { font-size: 14px !important; }
          /* 섹션 헤더 영역 축소 */
          .syc-section > div > div:first-child { margin-bottom: 28px !important; }
          /* 그리드 1열 + 간격 축소 */
          .benefit-grid, .step-grid, .roadmap-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .token-grid { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
          /* 카드 패딩 축소 */
          .benefit-grid > div, .step-grid > div, .roadmap-grid > div { padding: 16px 14px !important; border-radius: 12px !important; }
          .token-grid > div { padding: 12px !important; border-radius: 10px !important; }
          /* 통계바 */
          .stat-grid { padding: 14px 10px !important; gap: 12px !important; }
          /* 교차보상 */
          .cross-reward { flex-direction: column !important; text-align: center !important; padding: 14px !important; gap: 6px !important; }
          /* 글로우 라인 */
          .glow-line { width: 80% !important; }
          /* 푸터 */
          .footer-grid { grid-template-columns: 1fr !important; text-align: center !important; gap: 20px !important; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 21px !important; }
          .section-title { font-size: 18px !important; }
          .token-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══ 네비게이션 바 ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "10px clamp(12px,2vw,24px)", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <Image src="/syc-logo.png" alt="SYC" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span style={{ fontSize: "clamp(12px,1.8vw,16px)", fontWeight: 800, color: "#f5f5f7", whiteSpace: "nowrap" }}>SY Korea Panel</span>
        </Link>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {!loading && price && (
            <div className="ticker" style={{
              background: "rgba(62,230,196,0.1)", border: "1px solid rgba(62,230,196,0.2)",
              borderRadius: 16, padding: "4px 10px", fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 600, color: "#3ee6c4", whiteSpace: "nowrap",
            }}>
              1 SYC ≈ ₩{price.krw < 1 ? price.krw.toFixed(4) : price.krw.toFixed(2)}
            </div>
          )}
          <a href="https://syai.co.kr" target="_blank" rel="noopener noreferrer" style={{
            padding: "6px 10px", borderRadius: 8, fontSize: "clamp(11px,1.4vw,13px)", fontWeight: 700,
            background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", textDecoration: "none",
            whiteSpace: "nowrap",
          }}>
            🤖 AI
          </a>
          <Link href="/" style={{
            padding: "6px 10px", borderRadius: 8, fontSize: "clamp(11px,1.4vw,13px)", fontWeight: 700,
            background: "rgba(255,255,255,0.08)", color: "#f5f5f7", textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap",
          }}>
            🏠
          </Link>
        </div>
      </nav>

      {/* ═══ HERO 섹션 ═══ */}
      <section className="hero-bg hero-section-syc" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", position: "relative", overflow: "hidden",
      }}>
        {/* 배경 장식 */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(123,94,167,0.05)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(62,230,196,0.04)", filter: "blur(100px)" }} />

        <div style={{
          textAlign: "center", maxWidth: 800,
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}>
          {/* 로고 */}
          <div className="hero-logo-wrap" style={{ animation: "float 4s ease-in-out infinite", marginBottom: 32 }}>
            <Image src="/syc-logo.png" alt="SYC" width={100} height={100} style={{ borderRadius: "50%", boxShadow: "0 0 60px rgba(123,94,167,0.4)" }} />
          </div>

          <div className="hero-bep" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: "#7b5ea7", textTransform: "uppercase", marginBottom: 16 }}>
            BNB Smart Chain (BEP-20)
          </div>

          <h1 className="hero-title" style={{
            fontSize: 52, fontWeight: 900, lineHeight: 1.15, marginBottom: 20,
          }}>
            <span className="gradient-text">SY Coin</span>
            <br />
            <span style={{ color: "#f5f5f7", fontSize: "0.55em", fontWeight: 600 }}>
              건축자재 × AI × 블록체인
            </span>
          </h1>

          <p className="hero-sub" style={{
            fontSize: 17, color: "#86868b", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px",
          }}>
            실물 제조업의 매출과 AI 서비스 수익이 뒷받침하는<br />
            <b style={{ color: "#f5f5f7" }}>실사용 가치 기반</b> 유틸리티 토큰
          </p>

          {/* 실시간 시세 카드 */}
          <div className="hero-price-card" style={{
            display: "inline-flex", alignItems: "center", gap: 24,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "16px 32px", marginBottom: 40,
            flexWrap: "wrap", justifyContent: "center",
          }}>
            {loading ? (
              <span style={{ fontSize: 14, color: "#86868b" }}>⏳ 시세 조회 중...</span>
            ) : price ? (
              <>
                <div>
                  <div style={{ fontSize: 11, color: "#86868b", marginBottom: 2 }}>현재 시세</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }} className="gradient-text">₩{price.krw < 1 ? price.krw.toFixed(4) : price.krw.toFixed(2)}</div>
                </div>
                <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "#86868b", marginBottom: 2 }}>USD</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f7" }}>${price.usd.toFixed(6)}</div>
                </div>
                <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "#86868b", marginBottom: 2 }}>1 BNB</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f7" }}>{price.sycPerBnb.toLocaleString()} SYC</div>
                </div>
              </>
            ) : null}
          </div>

          <br />

          {/* CTA 버튼 */}
          <div className="hero-cta-wrap" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://pancakeswap.finance/swap?outputCurrency=0x6b2880CE191c790cA47329Dd761B07b71284785F&chainId=56" target="_blank" rel="noopener noreferrer" style={{
              padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 800,
              background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 8px 30px rgba(123,94,167,0.3)",
            }}>
              🥞 PancakeSwap에서 구매
            </a>
            <a href={`https://bscscan.com/token/${CONTRACT}`} target="_blank" rel="noopener noreferrer" style={{
              padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 800,
              background: "rgba(255,255,255,0.06)", color: "#f5f5f7",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              🔍 BscScan 보기
            </a>
            <a href="/SY_COIN_WHITEPAPER_v1.1.pdf" target="_blank" rel="noopener noreferrer" style={{
              padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 800,
              background: "rgba(255,255,255,0.06)", color: "#f5f5f7",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              📄 백서 다운로드
            </a>
          </div>
        </div>
      </section>

      {/* ═══ 통계 바 ═══ */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="section-container stat-grid" style={{
          display: "flex", justifyContent: "center", gap: "clamp(16px,3vw,48px)", padding: "clamp(14px,2.5vw,36px) clamp(12px,2vw,24px)", flexWrap: "wrap",
        }}>
          {[
            { label: "총 발행량", value: "1,000,000,000 SYC" },
            { label: "네트워크", value: "BNB Smart Chain" },
            { label: "추가 발행", value: "불가 (고정)" },
            { label: "SYC 결제 할인", value: "5~30%" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#86868b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, color: "#f5f5f7" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 1. SYC 코인이란? ═══ */}
      <section className="syc-section" style={{ padding: "clamp(36px,8vw,100px) clamp(14px,3vw,24px)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,5vw,60px)" }}>
            <div style={{ fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 700, letterSpacing: "clamp(2px,0.3vw,3px)", color: "#7b5ea7", marginBottom: 12 }}>ABOUT SYC</div>
            <h2 className="section-title" style={{ fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, marginBottom: "clamp(8px,1.5vw,16px)" }}>
              SY Coin은 <span className="gradient-text">실사용 가치</span>로 작동합니다
            </h2>
            <p style={{ fontSize: "clamp(12px,1.8vw,15px)", color: "#86868b", maxWidth: 600, margin: "0 auto", lineHeight: 1.8 }}>
              투기가 아닌, 실제 제조업 매출과 AI 서비스 수익이 토큰 경제를 뒷받침합니다.
            </p>
          </div>

          <div className="benefit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "clamp(8px,2vw,20px)" }}>
            {[
              {
                icon: "🏭", title: "건축자재 쇼핑몰",
                desc: "SY한국판넬의 스윙도어, 행가도어, 후레싱 등을 SYC로 결제하면 5~10% 할인!",
                color: "#7b5ea7",
              },
              {
                icon: "🤖", title: "AI 투자 플랫폼",
                desc: "DeepSoccer, DeepStock, DeepCrypto 구독을 SYC로 결제하면 20~30% 할인!",
                color: "#3ee6c4",
              },
              {
                icon: "🔄", title: "통합 생태계",
                desc: "건축자재 고객과 AI 구독자가 하나의 토큰으로 교차 보상받는 통합 생태계",
                color: "#e8b931",
              },
            ].map((item, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,36px) clamp(14px,2.5vw,28px)",
                animation: `fadeInUp 0.6s ease ${i * 0.15}s both`,
              }}>
                <div style={{ fontSize: "clamp(28px,4vw,40px)", marginBottom: "clamp(8px,1.5vw,16px)" }}>{item.icon}</div>
                <h3 style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, marginBottom: "clamp(6px,1vw,12px)", color: item.color }}>{item.title}</h3>
                <p style={{ fontSize: "clamp(11px,1.6vw,14px)", color: "#86868b", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 토큰 수요 구조 */}
          <div style={{
            marginTop: 48, background: "rgba(123,94,167,0.06)", border: "1px solid rgba(123,94,167,0.15)",
            borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,36px) clamp(14px,2.5vw,32px)",
          }}>
            <h3 style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, marginBottom: "clamp(10px,2vw,20px)" }}>📊 토큰 수요 창출 구조</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,1.5vw,16px)" }} className="benefit-grid">
              {[
                { emoji: "💳", title: "결제 수요", desc: "건축자재 구매 + AI 구독료를 SYC로 결제" },
                { emoji: "💰", title: "할인 수요", desc: "SYC 결제 시 5~30% 할인 → 현금보다 이득" },
                { emoji: "🔒", title: "스테이킹 수요", desc: "보유 시 VIP 혜택 (우선납품, 프리미엄 시그널)" },
                { emoji: "🔥", title: "소각 구조", desc: "매출의 일부로 바이백 → 소각 → 희소성 증가" },
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24 }}>{d.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f7", marginBottom: 4 }}>{d.title}</div>
                    <div style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "#86868b", lineHeight: 1.6 }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="glow-line" style={{ width: "60%" }} />

      {/* ═══ 2. SYC 구매 방법 (PancakeSwap 가이드) ═══ */}
      <section className="syc-section" style={{ padding: "clamp(36px,8vw,100px) clamp(14px,3vw,24px)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,5vw,60px)" }}>
            <div style={{ fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 700, letterSpacing: "clamp(2px,0.3vw,3px)", color: "#3ee6c4", marginBottom: 12 }}>HOW TO BUY</div>
            <h2 className="section-title" style={{ fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, marginBottom: "clamp(8px,1.5vw,16px)" }}>
              SYC <span className="gradient-text">구매 방법</span>
            </h2>
            <p style={{ fontSize: "clamp(12px,1.8vw,15px)", color: "#86868b", maxWidth: 550, margin: "0 auto", lineHeight: 1.8 }}>
              PancakeSwap에서 BNB로 간편하게 SYC를 구매할 수 있어요
            </p>
          </div>

          <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,2vw,20px)" }}>
            {[
              {
                step: 1, title: "메타마스크 설치",
                desc: "Chrome 확장프로그램 또는 모바일 앱으로 MetaMask를 설치하세요. BSC(BNB Smart Chain) 네트워크를 추가해주세요.",
                icon: "🦊",
              },
              {
                step: 2, title: "BNB 구매 & 전송",
                desc: "업비트나 바이낸스에서 BNB를 구매한 후, 메타마스크 지갑으로 전송하세요. BSC 네트워크로 보내야 해요!",
                icon: "💎",
              },
              {
                step: 3, title: "PancakeSwap 접속",
                desc: "PancakeSwap.finance에서 지갑을 연결하고, 'Swap' 메뉴에서 BNB → SYC로 교환하세요.",
                icon: "🥞",
              },
              {
                step: 4, title: "SYC로 결제 & 할인",
                desc: "sykoreapanel.com에서 건축자재를 SYC로 결제하면 10% 할인! 메타마스크 연결 후 바로 결제 가능!",
                icon: "🎉",
              },
            ].map((s, i) => (
              <div key={i} className={`step-card card-hover ${activeStep === i ? "step-active" : ""}`} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,32px) clamp(14px,2.5vw,28px)", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.04, fontWeight: 900,
                }}>{s.step}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: activeStep === i ? "linear-gradient(135deg, #7b5ea7, #3ee6c4)" : "rgba(123,94,167,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    transition: "all 0.4s",
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#7b5ea7", fontWeight: 700, letterSpacing: 1 }}>STEP {s.step}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f7" }}>{s.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "#86868b", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* PancakeSwap 바로가기 */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a href="https://pancakeswap.finance/swap?outputCurrency=0x6b2880CE191c790cA47329Dd761B07b71284785F&chainId=56" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "clamp(12px,2vw,16px) clamp(20px,3vw,36px)", borderRadius: 14, fontSize: "clamp(13px,2vw,16px)", fontWeight: 800,
              background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff",
              textDecoration: "none", boxShadow: "0 8px 30px rgba(123,94,167,0.3)",
            }}>
              🥞 PancakeSwap에서 SYC 구매하기
            </a>
            <div style={{ fontSize: 12, color: "#86868b", marginTop: 12 }}>
              컨트랙트 주소: <code style={{ color: "#3ee6c4", background: "rgba(62,230,196,0.1)", padding: "2px 8px", borderRadius: 6, fontSize: 10, wordBreak: "break-all", display: "inline-block", maxWidth: "100%" }}>{CONTRACT}</code>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-line" style={{ width: "60%" }} />

      {/* ═══ 3. SYC 결제 할인 혜택 ═══ */}
      <section className="syc-section" style={{ padding: "clamp(36px,8vw,100px) clamp(14px,3vw,24px)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,5vw,60px)" }}>
            <div style={{ fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 700, letterSpacing: "clamp(2px,0.3vw,3px)", color: "#e8b931", marginBottom: 12 }}>BENEFITS</div>
            <h2 className="section-title" style={{ fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, marginBottom: "clamp(8px,1.5vw,16px)" }}>
              SYC 결제 <span className="gradient-text">할인 혜택</span>
            </h2>
            <p style={{ fontSize: "clamp(12px,1.8vw,15px)", color: "#86868b", maxWidth: 550, margin: "0 auto", lineHeight: 1.8 }}>
              SYC로 결제하면 현금보다 무조건 이득!
            </p>
          </div>

          <div className="benefit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "clamp(8px,2vw,20px)" }}>
            {[
              {
                icon: "🏗️",
                title: "건축자재 쇼핑몰",
                discount: "5~10%",
                desc: "SY한국판넬의 스윙도어, 행가도어, 후레싱을 SYC로 결제하면 즉시 할인!",
                details: ["스윙도어 (평균 15만원)", "행가도어 (평균 120만원)", "후레싱/부자재 전품목"],
                gradient: "linear-gradient(135deg, #7b5ea7, #9b7ec8)",
              },
              {
                icon: "⚽",
                title: "DeepSoccer",
                discount: "20~30%",
                desc: "AI 축구토토 예측 서비스 구독을 SYC로 결제하면 대폭 할인!",
                details: ["AI 기반 축구 예측", "BTTS/스코어 분석", "실시간 배팅 시그널"],
                gradient: "linear-gradient(135deg, #3ee6c4, #2bc4a5)",
              },
              {
                icon: "📈",
                title: "DeepStock & DeepCrypto",
                discount: "20~30%",
                desc: "AI 주식/암호화폐 분석 서비스도 SYC 결제 시 할인!",
                details: ["AI 주식 분석 (예정)", "AI 코인 분석 (예정)", "프리미엄 시그널 액세스"],
                gradient: "linear-gradient(135deg, #e8b931, #f0c85a)",
              },
            ].map((b, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,36px) clamp(14px,2.5vw,28px)", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: b.gradient, borderRadius: "20px 20px 0 0",
                }} />
                <div style={{ fontSize: 40, marginBottom: 12 }}>{b.icon}</div>
                <h3 style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, color: "#f5f5f7", marginBottom: "clamp(4px,0.8vw,8px)" }}>{b.title}</h3>
                <div style={{
                  display: "inline-block", padding: "4px 14px", borderRadius: 20,
                  background: b.gradient, color: "#fff", fontSize: "clamp(15px,2.5vw,20px)", fontWeight: 900, marginBottom: 14,
                }}>{b.discount} 할인</div>
                <p style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "#86868b", lineHeight: 1.7, marginBottom: 16 }}>{b.desc}</p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  {b.details.map((d, j) => (
                    <div key={j} style={{ fontSize: 12, color: "#6e6e73", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#3ee6c4" }}>✓</span> {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 교차 보상 안내 */}
          <div className="cross-reward" style={{
            marginTop: 32, background: "linear-gradient(135deg, rgba(123,94,167,0.08), rgba(62,230,196,0.06))",
            border: "1px solid rgba(123,94,167,0.15)", borderRadius: 16, padding: "24px 28px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 32 }}>🔄</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f7", marginBottom: 4 }}>교차 보상 시스템</div>
              <div style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "#86868b", lineHeight: 1.7 }}>
                건축자재 구매 시 AI 서비스 할인쿠폰 지급 ↔ AI 구독 시 쇼핑몰 리워드 적립!
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-line" style={{ width: "60%" }} />

      {/* ═══ 4. 토큰 정보 (토큰노믹스 + BSCscan) ═══ */}
      <section className="syc-section" style={{ padding: "clamp(36px,8vw,100px) clamp(14px,3vw,24px)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,5vw,60px)" }}>
            <div style={{ fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 700, letterSpacing: "clamp(2px,0.3vw,3px)", color: "#7b5ea7", marginBottom: 12 }}>TOKENOMICS</div>
            <h2 className="section-title" style={{ fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, marginBottom: "clamp(8px,1.5vw,16px)" }}>
              <span className="gradient-text">토큰 정보</span>
            </h2>
          </div>

          {/* 기본 정보 카드 */}
          <div className="token-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
            {[
              { label: "토큰명", value: "SY Coin (SYC)" },
              { label: "네트워크", value: "BNB Smart Chain" },
              { label: "표준", value: "BEP-20" },
              { label: "총 발행량", value: "1,000,000,000" },
              { label: "소수점", value: "18자리" },
              { label: "추가 발행", value: "불가 (MaxSupply 고정)" },
            ].map((t, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "clamp(10px,1.5vw,14px)", padding: "clamp(12px,2vw,20px) clamp(12px,2vw,22px)",
              }}>
                <div style={{ fontSize: 11, color: "#86868b", marginBottom: 6, letterSpacing: 1 }}>{t.label}</div>
                <div style={{ fontSize: "clamp(12px,1.8vw,15px)", fontWeight: 700, color: "#f5f5f7" }}>{t.value}</div>
              </div>
            ))}
          </div>

          {/* 배분 구조 */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,36px) clamp(14px,2.5vw,32px)", marginBottom: "clamp(20px,4vw,40px)",
          }}>
            <h3 style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, marginBottom: "clamp(12px,2vw,24px)" }}>📊 토큰 배분 구조</h3>
            {[
              { label: "서비스 생태계", pct: 30, amount: "3억 SYC", color: "#7b5ea7", desc: "결제 보상, 할인 재원, 리워드 풀" },
              { label: "공개 판매", pct: 20, amount: "2억 SYC", color: "#3ee6c4", desc: "초기 자금 확보, DEX 유동성 공급" },
              { label: "전략적 파트너십", pct: 15, amount: "1.5억 SYC", color: "#e8b931", desc: "플랫폼 제휴 시 해제 (스마트컨트랙트 잠금)" },
              { label: "팀/창업자", pct: 15, amount: "1.5억 SYC", color: "#ff6b6b", desc: "12개월 리니어 베스팅" },
              { label: "마케팅/에어드랍", pct: 10, amount: "1억 SYC", color: "#5b8def", desc: "사용자 유치, 커뮤니티 성장" },
              { label: "유동성 풀", pct: 10, amount: "1억 SYC", color: "#ff9f43", desc: "PancakeSwap SYC/BNB 초기 유동성" },
            ].map((d, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f7" }}>{d.label}</span>
                    <span style={{ fontSize: 12, color: "#86868b" }}>({d.amount})</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.pct}%</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 4,
                    transition: "width 1s ease",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "#6e6e73", marginTop: 4 }}>{d.desc}</div>
              </div>
            ))}
          </div>

          {/* 컨트랙트 정보 */}
          <div style={{
            background: "linear-gradient(135deg, rgba(123,94,167,0.08), rgba(62,230,196,0.06))",
            border: "1px solid rgba(123,94,167,0.15)", borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,32px)",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>🔗 블록체인 정보</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}>컨트랙트 주소</div>
                <a href={`https://bscscan.com/token/${CONTRACT}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#3ee6c4", wordBreak: "break-all", textDecoration: "none" }}>
                  {CONTRACT} ↗
                </a>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}>DEX (PancakeSwap)</div>
                <a href="https://pancakeswap.finance/swap?outputCurrency=0x6b2880CE191c790cA47329Dd761B07b71284785F&chainId=56" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#3ee6c4", textDecoration: "none" }}>
                  PancakeSwap SYC/BNB ↗
                </a>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}>창업자</div>
                <div style={{ fontSize: 14, color: "#f5f5f7" }}>박재진 (Park Jaejin) — SY한국판넬 대표</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-line" style={{ width: "60%" }} />

      {/* ═══ 로드맵 ═══ */}
      <section className="syc-section" style={{ padding: "clamp(36px,8vw,100px) clamp(14px,3vw,24px)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,5vw,60px)" }}>
            <div style={{ fontSize: "clamp(10px,1.3vw,12px)", fontWeight: 700, letterSpacing: "clamp(2px,0.3vw,3px)", color: "#3ee6c4", marginBottom: 12 }}>ROADMAP</div>
            <h2 className="section-title" style={{ fontSize: "clamp(20px,4vw,36px)", fontWeight: 900 }}>
              <span className="gradient-text">로드맵</span>
            </h2>
          </div>

          <div className="roadmap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,2vw,20px)" }}>
            {[
              {
                phase: "Phase 1", title: "기반 구축", status: "✅ 완료",
                color: "#3ee6c4",
                items: ["✅ BEP-20 토큰 발행 완료", "✅ PancakeSwap 유동성 풀 구성", "✅ SY한국판넬 홈페이지 + SYC 결제", "✅ 백서 공개"],
              },
              {
                phase: "Phase 2", title: "서비스 연동", status: "🔄 진행 중",
                color: "#7b5ea7",
                items: ["DeepSoccer AI 유료화 론칭", "SY.ai 통합 플랫폼 구축", "스테이킹 시스템 도입", "커뮤니티 구축"],
              },
              {
                phase: "Phase 3", title: "생태계 확장", status: "📋 계획",
                color: "#e8b931",
                items: ["DeepStock, DeepCrypto 출시", "B2B 할인/리워드 시스템", "토큰 바이백 · 소각 개시", "전략적 파트너십 추진"],
              },
              {
                phase: "Phase 4", title: "성장 · 상장", status: "🎯 목표",
                color: "#ff6b6b",
                items: ["CEX 거래소 상장 신청", "법률 검토 · 가상자산 신고", "멀티체인 확장 검토", "생태계 규모 확대"],
              },
            ].map((r, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "clamp(12px,2vw,20px)", padding: "clamp(16px,3vw,32px) clamp(14px,2.5vw,28px)", position: "relative",
                borderLeft: `3px solid ${r.color}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: r.color, fontWeight: 700, letterSpacing: 1 }}>{r.phase}</div>
                    <div style={{ fontSize: "clamp(14px,2vw,18px)", fontWeight: 800, color: "#f5f5f7" }}>{r.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#86868b" }}>{r.status}</div>
                </div>
                {r.items.map((item, j) => (
                  <div key={j} style={{ fontSize: "clamp(11px,1.5vw,13px)", color: "#86868b", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: r.color, fontSize: 10 }}>●</span> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA 섹션 ═══ */}
      <section style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, transparent, rgba(123,94,167,0.08))",
      }}>
        <div className="section-container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, marginBottom: 16 }}>
            지금 <span className="gradient-text">SYC</span>를 시작하세요
          </h2>
          <p style={{ fontSize: 15, color: "#86868b", marginBottom: 32, lineHeight: 1.8 }}>
            건축자재 할인부터 AI 서비스까지, SYC 하나로 누리세요
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://pancakeswap.finance/swap?outputCurrency=0x6b2880CE191c790cA47329Dd761B07b71284785F&chainId=56" target="_blank" rel="noopener noreferrer" style={{
              padding: "clamp(12px,2vw,16px) clamp(20px,3vw,36px)", borderRadius: 14, fontSize: "clamp(13px,2vw,16px)", fontWeight: 800,
              background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              🥞 SYC 구매하기
            </a>
            <Link href="/" style={{
              padding: "clamp(12px,2vw,16px) clamp(20px,3vw,36px)", borderRadius: 14, fontSize: "clamp(13px,2vw,16px)", fontWeight: 800,
              background: "rgba(255,255,255,0.06)", color: "#f5f5f7",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              🏠 쇼핑몰 둘러보기
            </Link>
            <a href="https://syai.co.kr" target="_blank" rel="noopener noreferrer" style={{
              padding: "clamp(12px,2vw,16px) clamp(20px,3vw,36px)", borderRadius: 14, fontSize: "clamp(13px,2vw,16px)", fontWeight: 800,
              background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 8px 30px rgba(255,107,53,0.3)",
            }}>
              🤖 SY.ai 바로가기
            </a>
          </div>
        </div>
      </section>

      {/* ═══ 푸터 ═══ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)", padding: "48px 24px 32px",
        background: "rgba(0,0,0,0.3)",
      }}>
        <div className="section-container footer-grid" style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 32,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Image src="/syc-logo.png" alt="SYC" width={28} height={28} style={{ borderRadius: "50%" }} />
              <span style={{ fontSize: 16, fontWeight: 800 }}>SY Coin (SYC)</span>
            </div>
            <p style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.7, maxWidth: 360 }}>
              건축자재 × AI × 블록체인 통합 생태계.
              실물 제조업과 AI 서비스가 만드는 실사용 가치 토큰.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 12, letterSpacing: 1 }}>LINKS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`https://bscscan.com/token/${CONTRACT}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#6e6e73", textDecoration: "none" }}>BscScan ↗</a>
              <a href="https://pancakeswap.finance/swap?outputCurrency=0x6b2880CE191c790cA47329Dd761B07b71284785F&chainId=56" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#6e6e73", textDecoration: "none" }}>PancakeSwap ↗</a>
              <a href="/SY_COIN_WHITEPAPER_v1.1.pdf" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#6e6e73", textDecoration: "none" }}>📄 백서 (Whitepaper)</a>
              <Link href="/" style={{ fontSize: 13, color: "#6e6e73", textDecoration: "none" }}>SY한국판넬 쇼핑몰</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 12, letterSpacing: 1 }}>CONTACT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6e6e73" }}>SY한국판넬</span>
              <span style={{ fontSize: 13, color: "#6e6e73" }}>경기도 평택</span>
              <a href="http://pf.kakao.com/_vDxfmn/chat" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#6e6e73", textDecoration: "none" }}>💬 카카오톡 문의</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#3a3a3c", lineHeight: 1.7 }}>
            © 2026 SY Coin Project. All rights reserved.<br />
            본 프로젝트는 에스와이(주) 및 SY그룹의 공식 프로젝트가 아니며, 독립적으로 운영됩니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
