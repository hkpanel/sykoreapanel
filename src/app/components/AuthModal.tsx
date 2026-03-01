"use client";
import { useState } from "react";
import Image from "next/image";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getAuthErrorMessage,
} from "@/lib/auth";

interface AuthModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailAuth = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("이름을 입력해주세요"); setLoading(false); return; }
        await signUpWithEmail(email, password, name, phone);
      } else {
        await signInWithEmail(email, password);
      }
      onLogin();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getAuthErrorMessage(code));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      onLogin();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getAuthErrorMessage(code));
    }
    setLoading(false);
  };

  const handleKakao = () => {
    setError("카카오 로그인은 준비 중이에요! 구글 또는 이메일로 이용해주세요.");
  };

  const handleNaver = () => {
    setError("네이버 로그인은 준비 중이에요! 구글 또는 이메일로 이용해주세요.");
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "2px solid #e8e8ed", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, width: "calc(100% - 32px)", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div style={{ padding: "28px 28px 0", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Image src="/syc-logo.png" alt="SY" width={48} height={48} style={{ borderRadius: "50%" }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1d1d1f", margin: "0 0 4px" }}>
            {mode === "login" ? "로그인" : "회원가입"}
          </h2>
          <p style={{ fontSize: 13, color: "#86868b", margin: 0 }}>
            SY Korea Panel {mode === "login" ? "계정으로 로그인" : "에 가입하세요"}
          </p>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, border: "none", background: "#f5f5f7", fontSize: 16, cursor: "pointer", color: "#86868b" }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px" }}>
          {/* 소셜 로그인 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button onClick={handleKakao} disabled={loading}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#FEE500", color: "#191919", transition: "opacity 0.2s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.6 1.74 4.9 4.36 6.22-.14.52-.9 3.34-.93 3.55 0 0-.02.16.08.22.1.06.22.03.22.03.3-.04 3.44-2.26 3.98-2.64.74.1 1.5.16 2.29.16 5.52 0 10-3.36 10-7.54C22 6.36 17.52 3 12 3" fill="#191919"/></svg>
              카카오로 {mode === "login" ? "로그인" : "시작하기"}
            </button>
            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e8e8ed", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", color: "#1d1d1f", transition: "opacity 0.2s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 {mode === "login" ? "로그인" : "시작하기"}
            </button>
            <button onClick={handleNaver} disabled={loading}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#03C75A", color: "#fff", transition: "opacity 0.2s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M16.27 3H7.73L3 12l4.73 9h8.54L21 12l-4.73-9zM13.1 14.74L10.43 12v2.74H8.57V7.26h1.86V10l2.67-2.74h2.33L12.67 12l2.76 2.74h-2.33z" fill="#fff"/></svg>
              네이버로 {mode === "login" ? "로그인" : "시작하기"}
            </button>
          </div>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#e8e8ed" }} />
            <span style={{ fontSize: 12, color: "#86868b" }}>또는 이메일로</span>
            <div style={{ flex: 1, height: 1, background: "#e8e8ed" }} />
          </div>

          {/* 이메일 폼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <>
                <input type="text" placeholder="이름 *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                <input type="tel" placeholder="연락처 (선택)" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              </>
            )}
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
          </div>

          {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(227,64,64,0.06)", color: "#e34040", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(62,230,196,0.06)", color: "#0f8a6c", fontSize: 13, fontWeight: 600 }}>{success}</div>}

          <button onClick={handleEmailAuth} disabled={loading || !email || !password}
            style={{ width: "100%", marginTop: 16, padding: "14px 0", border: "none", borderRadius: 14, background: (!email || !password) ? "#e0e0e0" : "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: (!email || !password) ? "default" : "pointer", transition: "all 0.2s" }}>
            {loading ? "잠시만..." : (mode === "login" ? "로그인" : "가입하기")}
          </button>

          {/* 모드 전환 */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ fontSize: 13, color: "#86868b" }}>
              {mode === "login" ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
            </span>
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
              style={{ background: "none", border: "none", color: "#7b5ea7", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
