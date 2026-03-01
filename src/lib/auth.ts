/**
 * Auth 서비스 — 인증 관련 모든 기능 한곳에서 관리
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── 구글 로그인 (카카오처럼 직접 OAuth 리다이렉트) ───
export function signInWithGoogle() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/google`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  window.location.href = googleAuthUrl;
}

// ─── 이메일/비밀번호 회원가입 ───
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  phone?: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  await setDoc(doc(db, "users", result.user.uid), {
    name,
    phone: phone || "",
    email,
    provider: "email",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return result.user;
}

// ─── 이메일/비밀번호 로그인 ───
export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

// ─── 로그아웃 ───
export async function signOut() {
  return firebaseSignOut(auth);
}

// ─── 로그인 상태 변경 감지 ───
export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// ─── 현재 유저 가져오기 ───
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ─── 유저 프로필 보장 ───
async function ensureUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || "",
      phone: "",
      email: user.email || "",
      provider: user.providerData[0]?.providerId || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── 유저 프로필 업데이트 ───
export async function updateUserProfile(uid: string, data: { name?: string; phone?: string }) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  if (data.name && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.name });
  }
}

// ─── 유저 프로필 가져오기 ───
export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ─── 카카오 로그인 ───
export function signInWithKakao() {
  const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const redirectUri = `${window.location.origin}/auth/kakao`;
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  window.location.href = kakaoAuthUrl;
}

// ─── 에러 메시지 한글화 ───
export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "이미 가입된 이메일이에요",
    "auth/invalid-email": "이메일 형식이 올바르지 않아요",
    "auth/weak-password": "비밀번호는 6자 이상이어야 해요",
    "auth/user-not-found": "등록되지 않은 이메일이에요",
    "auth/wrong-password": "비밀번호가 맞지 않아요",
    "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요",
    "auth/too-many-requests": "너무 많이 시도했어요. 잠시 후 다시 해주세요",
    "auth/popup-closed-by-user": "로그인 팝업이 닫혔어요. 다시 시도해주세요",
    "auth/network-request-failed": "네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요",
  };
  return messages[code] || "로그인 중 오류가 발생했어요. 다시 시도해주세요";
}
