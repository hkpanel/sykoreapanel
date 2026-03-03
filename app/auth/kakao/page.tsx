"use client";
import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * 카카오 로그인 콜백 페이지
 * 카카오에서 리다이렉트 → 인가코드로 Firebase 로그인 처리
 */
export default function KakaoCallback() {
  const [status, setStatus] = useState("카카오 로그인 처리 중...");

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      setStatus("카카오 로그인이 취소되었어요");
      setTimeout(() => window.location.href = "/", 2000);
      return;
    }

    if (!code) {
      setStatus("인가코드가 없습니다");
      setTimeout(() => window.location.href = "/", 2000);
      return;
    }

    // API 라우트로 인가코드 전송 → Firebase Custom Token 받기
    (async () => {
      try {
        const res = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/kakao`,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.customToken) {
          setStatus("로그인 실패: " + (data.error || "알 수 없는 오류"));
          setTimeout(() => window.location.href = "/", 2000);
          return;
        }

        // Firebase Custom Token으로 로그인
        const credential = await signInWithCustomToken(auth, data.customToken);
        const user = credential.user;

        // Firestore에 유저 프로필 저장/업데이트
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            name: data.user.name || "",
            phone: "",
            email: data.user.email || "",
            provider: "kakao",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            name: data.user.name || snap.data().name || "",
            provider: "kakao",
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        setStatus("로그인 성공! 이동 중...");
        window.location.href = "/";
      } catch (err) {
        console.error("카카오 로그인 처리 에러:", err);
        setStatus("로그인 처리 중 오류가 발생했어요");
        setTimeout(() => window.location.href = "/", 2000);
      }
    })();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg, #1a1a2e, #12122a)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f7", marginBottom: 8 }}>{status}</div>
        <div style={{
          width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "#FEE500", borderRadius: "50%",
          animation: "spin 1s linear infinite", margin: "20px auto",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
