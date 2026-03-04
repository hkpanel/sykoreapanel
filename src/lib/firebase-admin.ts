/**
 * Firebase Admin SDK (서버사이드 전용)
 * 구글/카카오 로그인 등 Custom Token 발급에 사용
 */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  // 방법1: JSON 통째로 (FIREBASE_SERVICE_ACCOUNT_JSON)
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    // 방법2: 개별 환경변수
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
