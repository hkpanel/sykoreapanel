/**
 * Firestore DB 서비스
 * ───────────────────
 * 장바구니, 배송지, 유저 프로필 — 모두 여기서 관리
 * onSnapshot 으로 PC↔모바일 실시간 동기화
 *
 * Firestore 구조:
 *   users/{uid}          ← 유저 프로필
 *   users/{uid}/cart/{key}      ← 장바구니 아이템
 *   users/{uid}/addresses/{id}  ← 배송지
 *   users/{uid}/orders/{id}     ← 주문내역 (나중에 확장)
 */
import {
  collection, doc, setDoc, deleteDoc, getDocs,
  onSnapshot, writeBatch, serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ═══════════════════════════════════════
//  타입 정의 (프로젝트 전체에서 공유)
// ═══════════════════════════════════════

export interface CartItem {
  key: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  colorSub?: string;
  retailPrice: number;
  qty: number;
  image?: string;
  category?: "flashing" | "swing" | "hanga";
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
}

// ═══════════════════════════════════════
//  장바구니 (Cart)
// ═══════════════════════════════════════

/** 장바구니 실시간 구독 — 다른 기기에서 변경되면 즉시 반영 */
export function subscribeCart(uid: string, callback: (items: CartItem[]) => void): Unsubscribe {
  const ref = collection(db, "users", uid, "cart");
  return onSnapshot(ref, (snap) => {
    const items: CartItem[] = [];
    snap.forEach((doc) => items.push(doc.data() as CartItem));
    callback(items);
  });
}

/** 장바구니에 아이템 추가/수량 업데이트 */
export async function setCartItem(uid: string, item: CartItem) {
  // Firestore 문서 ID에 쓸 수 없는 문자(/)를 안전하게 변환
  const docId = item.key.replace(/\//g, "_");
  const ref = doc(db, "users", uid, "cart", docId);
  // Firestore는 undefined 값 저장 불가 → 제거
  const clean = Object.fromEntries(
    Object.entries({ ...item, updatedAt: serverTimestamp() }).filter(([, v]) => v !== undefined)
  );
  await setDoc(ref, clean);
}

/** 장바구니에서 아이템 삭제 */
export async function removeCartItem(uid: string, key: string) {
  const docId = key.replace(/\//g, "_");
  const ref = doc(db, "users", uid, "cart", docId);
  await deleteDoc(ref);
}

/** 장바구니 전체 비우기 */
export async function clearCart(uid: string) {
  const ref = collection(db, "users", uid, "cart");
  const snap = await getDocs(ref);
  const batch = writeBatch(db);
  snap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

// ═══════════════════════════════════════
//  배송지 (Addresses)
// ═══════════════════════════════════════

/** 배송지 실시간 구독 */
export function subscribeAddresses(uid: string, callback: (addrs: Address[]) => void): Unsubscribe {
  const ref = collection(db, "users", uid, "addresses");
  return onSnapshot(ref, (snap) => {
    const addrs: Address[] = [];
    snap.forEach((doc) => addrs.push({ id: doc.id, ...doc.data() } as Address));
    callback(addrs);
  });
}

/** 배송지 저장 (추가 or 수정) */
export async function saveAddress(uid: string, addr: Address) {
  const ref = doc(db, "users", uid, "addresses", addr.id);
  await setDoc(ref, { ...addr, updatedAt: serverTimestamp() });
}

/** 배송지 삭제 */
export async function deleteAddress(uid: string, addrId: string) {
  const ref = doc(db, "users", uid, "addresses", addrId);
  await deleteDoc(ref);
}

/** 기본 배송지 설정 (다른 것들은 isDefault: false로) */
export async function setDefaultAddress(uid: string, addrId: string) {
  const colRef = collection(db, "users", uid, "addresses");
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  snap.forEach((d) => {
    batch.update(d.ref, { isDefault: d.id === addrId });
  });
  await batch.commit();
}

// ═══════════════════════════════════════
//  localStorage → Firestore 마이그레이션
//  (기존 유저의 데이터를 한번만 옮겨줌)
// ═══════════════════════════════════════

export async function migrateLocalData(uid: string) {
  const migrated = localStorage.getItem(`migrated_${uid}`);
  if (migrated) return; // 이미 마이그레이션 완료

  try {
    // 장바구니 마이그레이션
    const cartData = localStorage.getItem("sy_cart");
    if (cartData) {
      const items: CartItem[] = JSON.parse(cartData);
      for (const item of items) {
        await setCartItem(uid, item);
      }
      localStorage.removeItem("sy_cart");
    }

    // 배송지 마이그레이션
    const addrData = localStorage.getItem(`addresses_${uid}`);
    if (addrData) {
      const addrs: Address[] = JSON.parse(addrData);
      for (const addr of addrs) {
        await saveAddress(uid, addr);
      }
      localStorage.removeItem(`addresses_${uid}`);
    }

    localStorage.setItem(`migrated_${uid}`, "true");
    console.log("✅ localStorage → Firestore 마이그레이션 완료");
  } catch (err) {
    console.error("마이그레이션 실패:", err);
  }
}
