import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * 카카오 로그인 API 라우트
 * 1. 클라이언트에서 카카오 인가코드를 받아옴
 * 2. 카카오 서버에서 access_token 교환
 * 3. 카카오 사용자 정보 조회
 * 4. Firebase Custom Token 발급하여 반환
 */
export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "인가코드가 없습니다" }, { status: 400 });
    }

    // ─── 1단계: 카카오 access_token 발급 ───
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("카카오 토큰 에러:", tokenData);
      return NextResponse.json({ error: "카카오 인증 실패" }, { status: 401 });
    }

    // ─── 2단계: 카카오 사용자 정보 조회 ───
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const kakaoUser = await userRes.json();
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname || "";
    const email = kakaoUser.kakao_account?.email || "";

    // ─── 3단계: Firebase Custom Token 발급 ───
    // uid를 "kakao_12345" 형태로 만들어서 다른 로그인과 충돌 방지
    const firebaseUid = `kakao_${kakaoId}`;

    const customToken = await adminAuth.createCustomToken(firebaseUid, {
      provider: "kakao",
      kakaoId,
      name: nickname,
      email,
    });

    // Firebase Auth에 유저가 없으면 생성, 있으면 업데이트
    try {
      await adminAuth.getUser(firebaseUid);
      // 이미 있으면 프로필 업데이트
      await adminAuth.updateUser(firebaseUid, {
        displayName: nickname,
        ...(email ? { email } : {}),
      });
    } catch {
      // 없으면 새로 생성
      await adminAuth.createUser({
        uid: firebaseUid,
        displayName: nickname,
        ...(email ? { email } : {}),
      });
    }

    return NextResponse.json({
      customToken,
      user: { uid: firebaseUid, name: nickname, email },
    });
  } catch (err) {
    console.error("카카오 로그인 에러:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
