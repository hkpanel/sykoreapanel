import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * 구글 로그인 API 라우트 (서버사이드 OAuth)
 * Firebase 팝업/리다이렉트 안 씀 → 모바일 100% 동작
 */
export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "인가코드가 없습니다" }, { status: 400 });
    }

    // 1단계: 구글 access_token 발급
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("구글 토큰 에러:", tokenData);
      return NextResponse.json({ error: "구글 인증 실패" }, { status: 401 });
    }

    // 2단계: 구글 사용자 정보 조회
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    const googleId = String(googleUser.id);
    const name = googleUser.name || "";
    const email = googleUser.email || "";

    // 3단계: Firebase Custom Token 발급
    const firebaseUid = `google_${googleId}`;
    const customToken = await adminAuth.createCustomToken(firebaseUid);

    // Firebase Auth 유저 생성/업데이트
    try {
      await adminAuth.getUser(firebaseUid);
      await adminAuth.updateUser(firebaseUid, {
        displayName: name,
        email,
        photoURL: googleUser.picture || undefined,
      });
    } catch {
      await adminAuth.createUser({
        uid: firebaseUid,
        displayName: name,
        email,
        photoURL: googleUser.picture || undefined,
      });
    }

    return NextResponse.json({
      customToken,
      user: { uid: firebaseUid, name, email },
    });
  } catch (err) {
    console.error("구글 로그인 에러:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
