/**
 * Auth 서비스 — 인증 관련 모든 기능 한곳에서 관리
 * 나중에 카카오, 네이버, 애플 로그인 추가할 때도 여기만 수정하면 됨
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  updateProfile,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── 모바일 감지 ───
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// ─── 구글 로그인 (PC: 팝업 / 모바일: 리다이렉트) ───
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (isMobile()) {
    // 모바일 → 리다이렉트 방식 (팝업이 안 먹힘)
    await signInWithRedirect(auth, googleProvider);
    // 리다이렉트 후 돌아오면 handleRedirectResult()에서 처리
    return null;
  } else {
    // PC → 팝업 방식
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  }
}

// ─── 리다이렉트 결과 처리 (모바일 구글 로그인 후 복귀 시) ───
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserProfile(result.user);
      return result.user;
    }
  } catch (err) {
    console.error("리다이렉트 로그인 처리 에러:", err);
  }
  return null;
}

// ─── 이메일/비밀번호 회원가입 ───
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  phone?: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Firebase Auth 프로필에 이름 저장
  await updateProfile(result.user, { displayName: name });
  // Firestore에 유저 프로필 생성
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

// ─── 유저 프로필 보장 (소셜 로그인 시 Firestore에 프로필 없으면 생성) ───
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
  // Firebase Auth displayName도 동기화
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

// ─── 카카오 로그인 (리다이렉트 방식) ───
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
