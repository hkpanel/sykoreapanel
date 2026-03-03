import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * 네이버 로그인 API 라우트 (서버사이드 OAuth)
 */
export async function POST(req: NextRequest) {
  try {
    const { code, state, redirectUri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "인가코드가 없습니다" }, { status: 400 });
    }

    // 1단계: 네이버 access_token 발급
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: state || "",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("네이버 토큰 에러:", tokenData);
      return NextResponse.json({ error: "네이버 인증 실패" }, { status: 401 });
    }

    // 2단계: 네이버 사용자 정보 조회
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    const naverUser = userData.response;
    const naverId = String(naverUser.id);
    const name = naverUser.name || naverUser.nickname || "";
    const email = naverUser.email || "";

    // 3단계: 기존 유저 찾기 (이메일로)
    let firebaseUid: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      firebaseUid = existingUser.uid;
      await adminAuth.updateUser(firebaseUid, {
        displayName: name,
        photoURL: naverUser.profile_image || undefined,
      });
    } catch {
      firebaseUid = `naver_${naverId}`;
      try {
        await adminAuth.createUser({
          uid: firebaseUid,
          displayName: name,
          email: email || undefined,
          photoURL: naverUser.profile_image || undefined,
        });
      } catch {
        await adminAuth.createUser({
          uid: firebaseUid,
          displayName: name,
          photoURL: naverUser.profile_image || undefined,
        });
      }
    }

    // 4단계: Firebase Custom Token 발급
    const customToken = await adminAuth.createCustomToken(firebaseUid);

    return NextResponse.json({
      customToken,
      user: { uid: firebaseUid, name, email },
    });
  } catch (err) {
    console.error("네이버 로그인 에러:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
