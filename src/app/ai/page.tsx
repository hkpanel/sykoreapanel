/**
 * SY.ai 메인 랜딩 페이지
 * ───────────────────────
 * AI 투자 서비스 소개 + 서비스 카드 (DeepStock, DeepCrypto, DeepSoccer)
 *
 * 📌 src/app/ai/page.tsx 에 배치
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/* ─── 애니메이션 카운터 ─── */
function AnimNum({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = value / 50;
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setD(value); clearInterval(t); } else setD(Math.floor(n));
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <span>{prefix}{d.toLocaleString()}{suffix}</span>;
}

/* ─── 서비스 카드 데이터 ─── */
const SERVICES = [
  {
    id: "deepstock",
    name: "DeepStock",
    icon: "📈",
    status: "LIVE",
    statusColor: "#00d4aa",
    desc: "한국투자증권 API 연동 자동매매",
    detail: "리밸런싱 + 차트매매 혼합 전략으로 국내 주식 자동 운용. 한투 API키만 등록하면 서버가 24시간 매매합니다.",
    features: ["자동 리밸런싱", "차트 시그널 매매", "실시간 포트폴리오", "매매 알림"],
    href: "/ai/deepstock",
    gradient: "linear-gradient(135deg, #00d4aa, #00b894)",
  },
  {
    id: "deepcrypto",
    name: "DeepCrypto",
    icon: "₿",
    status: "준비중",
    statusColor: "#f0b90b",
    desc: "암호화폐 AI 분석 & 시그널",
    detail: "비트코인, 이더리움 등 주요 코인의 매매 시점을 AI가 분석하여 프리미엄 시그널을 제공합니다.",
    features: ["AI 차트 분석", "매매 시그널", "변동성 알림", "포트폴리오 추적"],
    href: "#",
    gradient: "linear-gradient(135deg, #f0b90b, #f5d442)",
  },
  {
    id: "deepsoccer",
    name: "DeepSoccer",
    icon: "⚽",
    status: "준비중",
    statusColor: "#4a90d9",
    desc: "축구 AI 예측 분석",
    detail: "전세계 주요 리그 경기 결과를 AI가 분석하여 데이터 기반 예측을 제공합니다.",
    features: ["경기 결과 예측", "배당률 분석", "팀 폼 분석", "실시간 업데이트"],
    href: "#",
    gradient: "linear-gradient(135deg, #4a90d9, #357abd)",
  },
];

export default function AiMainPage() {
  const [vis, setVis] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => { setVis(true); }, []);

  return (
    <div style={{ overflow: "hidden" }}>
      <style>{`
        @keyframes heroGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .svc-card { transition: all 0.4s cubic-bezier(0.22,1,0.36,1); border: 1px solid rgba(255,255,255,0.06); }
        .svc-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.12); }
        .svc-card .arrow { transition: transform 0.3s; }
        .svc-card:hover .arrow { transform: translateX(6px); }
      `}</style>

      {/* ═══ 히어로 섹션 ═══ */}
      <section style={{ position: "relative", padding: "120px 24px 80px", textAlign: "center", overflow: "hidden" }}>
        {/* 배경 글로우 */}
        <div style={{
          position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)",
          animation: "heroGlow 6s ease infinite", pointerEvents: "none",
        }} />

        <div style={{
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)",
            fontSize: 13, color: "#00d4aa", fontWeight: 500, marginBottom: 24,
          }}>
            🤖 AI × 투자 × 블록체인
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.15,
            letterSpacing: "-1.5px", marginBottom: 20,
          }}>
            <span style={{ color: "#e8e8ed" }}>투자의 미래,</span><br />
            <span style={{
              background: "linear-gradient(135deg, #00d4aa, #00e4bb, #7cf5d3)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>AI가 운용합니다</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)", color: "#6b6b7e", lineHeight: 1.7,
            maxWidth: 560, margin: "0 auto 40px",
          }}>
            한국투자증권 API 연동 자동매매부터<br />
            암호화폐 시그널, 스포츠 AI 예측까지.<br />
            SYC 코인으로 결제하면 최대 30% 할인.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ai/deepstock" style={{
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              background: "linear-gradient(135deg, #00d4aa, #00b894)",
              color: "#08080c", fontWeight: 700, fontSize: 15,
              transition: "all 0.2s",
            }}>
              DeepStock 시작하기 →
            </Link>
            <Link href="/syc" style={{
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8ed",
              fontWeight: 500, fontSize: 15, transition: "all 0.2s",
            }}>
              SYC 코인 알아보기
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 48, marginTop: 80, flexWrap: "wrap",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
        }}>
          {[
            { label: "창업자 투자 경력", value: 20, suffix: "년" },
            { label: "트레이딩봇 운영", value: 10, suffix: "년" },
            { label: "전략 자동 실행", value: 24, suffix: "시간" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#00d4aa", marginBottom: 4 }}>
                <AnimNum value={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: "#6b6b7e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 서비스 카드 섹션 ═══ */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>
            AI 서비스 라인업
          </h2>
          <p style={{ fontSize: 15, color: "#6b6b7e" }}>
            SY.ai에서 제공하는 AI 기반 서비스를 만나보세요
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {SERVICES.map((svc, idx) => (
            <div key={svc.id} className="svc-card"
              onMouseEnter={() => setHoveredCard(svc.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === svc.id
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.02)",
                borderRadius: 20, padding: 32, cursor: svc.status === "LIVE" ? "pointer" : "default",
                opacity: vis ? 1 : 0,
                transform: vis ? "translateY(0)" : "translateY(40px)",
                transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.1 * idx}s`,
                position: "relative", overflow: "hidden",
              }}
              onClick={() => { if (svc.status === "LIVE") window.location.href = svc.href; }}
            >
              {/* 카드 상단 글로우 */}
              <div style={{
                position: "absolute", top: -60, right: -60, width: 160, height: 160,
                borderRadius: "50%", background: svc.gradient, opacity: 0.06,
                transition: "opacity 0.4s",
                ...(hoveredCard === svc.id ? { opacity: 0.12 } : {}),
              }} />

              {/* 아이콘 + 상태 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${svc.gradient}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, opacity: 0.9,
                }}>
                  {svc.icon}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 6,
                  background: `${svc.statusColor}15`,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: svc.statusColor,
                    animation: svc.status === "LIVE" ? "pulse 2s infinite" : "none",
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: svc.statusColor }}>
                    {svc.status}
                  </span>
                </div>
              </div>

              {/* 서비스 정보 */}
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 6 }}>
                {svc.name}
              </h3>
              <p style={{ fontSize: 14, color: "#8b8b9e", marginBottom: 16 }}>{svc.desc}</p>
              <p style={{ fontSize: 13, color: "#6b6b7e", lineHeight: 1.7, marginBottom: 24 }}>{svc.detail}</p>

              {/* 기능 태그 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {svc.features.map((f) => (
                  <span key={f} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12,
                    background: "rgba(255,255,255,0.04)", color: "#8b8b9e",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>{f}</span>
                ))}
              </div>

              {/* CTA */}
              {svc.status === "LIVE" ? (
                <div className="arrow" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 14, fontWeight: 600, color: "#00d4aa",
                }}>
                  시작하기 <span style={{ fontSize: 18 }}>→</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#4a4a5e" }}>
                  서비스 준비중입니다. SYC 코인으로 결제 시 20~30% 할인!
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SYC 할인 배너 ═══ */}
      <section style={{
        maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,184,148,0.04))",
          border: "1px solid rgba(0,212,170,0.12)", borderRadius: 20,
          padding: "40px 32px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 8 }}>
              🪙 SYC 코인으로 결제하면 최대 30% 할인
            </h3>
            <p style={{ fontSize: 14, color: "#8b8b9e" }}>
              충전금을 SYC 코인으로 결제하면 원화 대비 20~30% 할인된 가격으로 서비스를 이용할 수 있습니다.
            </p>
          </div>
          <Link href="/syc" style={{
            padding: "12px 28px", borderRadius: 12, textDecoration: "none",
            background: "linear-gradient(135deg, #00d4aa, #00b894)",
            color: "#08080c", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
          }}>
            SYC 구매하기
          </Link>
        </div>
      </section>
    </div>
  );
}
