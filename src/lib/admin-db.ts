/**
 * 관리자 전용 Firestore 서비스
 * ─────────────────────────────
 * collectionGroup으로 전체 유저의 주문을 한번에 조회
 * 관리자 이메일: bbajae1@naver.com
 */
import {
  collection, collectionGroup, getDocs, doc, updateDoc, deleteDoc,
  query,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ═══ 관리자 이메일 ═══
export const ADMIN_EMAIL = "bbajae1@naver.com";

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

// ═══ 타입 정의 ═══
export interface AdminOrder {
  id: string;
  uid: string;
  paymentId: string;
  orderName?: string;
  status: "pending_payment" | "paid" | "confirmed" | "producing" | "shipped" | "delivered" | "completed" | "cancelled";
  items: {
    productName: string;
    size: string;
    color: string;
    colorSub?: string;
    retailPrice: number;
    qty: number;
    category?: string;
    image?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  payMethod: string;
  deliveryType: string;
  addressId?: string;
  addressLabel?: string;
  addressFull?: string;
  addressPhone?: string;
  addressReceiver?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt?: Timestamp;
  // 고객 요청사항
  deliveryNote?: string;
  preferredDate?: string;
  customerMemo?: string;
  // 관리자 입력
  trackingNumber?: string;
  trackingCarrier?: string;
  truckMemo?: string;
  estimatedDelivery?: string;
  adminMemo?: string;
  statusHistory?: { status: string; at: string; note?: string }[];
  // 유저 정보 (조인)
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  provider?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  orderCount?: number;
  totalSpent?: number;
}

// ═══ 전체 주문 조회 ═══
export async function fetchAllOrders(): Promise<AdminOrder[]> {
  // orderBy 없이 조회 → 인덱스 불필요!
  const q = query(
    collectionGroup(db, "orders"),
  );
  const snap = await getDocs(q);
  const orders: AdminOrder[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    // 부모 경로에서 uid 추출: users/{uid}/orders/{orderId}
    const pathSegments = docSnap.ref.path.split("/");
    const uid = pathSegments[1]; // users/[uid]/orders/[id]

    orders.push({
      id: docSnap.id,
      uid,
      paymentId: data.paymentId || docSnap.id,
      orderName: data.orderName || "",
      status: data.status || "paid",
      items: data.items || [],
      subtotal: data.subtotal || 0,
      deliveryFee: data.deliveryFee || 0,
      tax: data.tax || 0,
      totalAmount: data.totalAmount || 0,
      payMethod: data.payMethod || "",
      deliveryType: data.deliveryType || "",
      addressId: data.addressId,
      addressLabel: data.addressLabel,
      addressFull: data.addressFull,
      addressPhone: data.addressPhone,
      addressReceiver: data.addressReceiver,
      receiptUrl: data.receiptUrl,
      paidAt: data.paidAt,
      createdAt: data.createdAt,
      deliveryNote: data.deliveryNote,
      preferredDate: data.preferredDate,
      customerMemo: data.customerMemo,
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier,
      truckMemo: data.truckMemo,
      estimatedDelivery: data.estimatedDelivery,
      adminMemo: data.adminMemo,
      statusHistory: data.statusHistory,
      userEmail: data.userEmail,
      userName: data.userName,
      userPhone: data.userPhone,
    });
  });

  // 클라이언트에서 최신순 정렬
  orders.sort((a, b) => {
    const tA = a.createdAt ? a.createdAt.seconds : 0;
    const tB = b.createdAt ? b.createdAt.seconds : 0;
    return tB - tA;
  });

  return orders;
}

// ═══ 주문 상태 변경 ═══
export async function updateOrderStatus(
  uid: string,
  orderId: string,
  newStatus: AdminOrder["status"]
) {
  const ref = doc(db, "users", uid, "orders", orderId);
  await updateDoc(ref, { status: newStatus });
}

// ═══ 주문 상세 정보 업데이트 (관리자) ═══
export async function updateOrderDetails(
  uid: string,
  orderId: string,
  updates: Record<string, unknown>
) {
  const ref = doc(db, "users", uid, "orders", orderId);
  // undefined 값 제거
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, clean);
}

// ═══ 주문 영구 삭제 (관리자) ═══
export async function deleteOrder(uid: string, orderId: string) {
  const ref = doc(db, "users", uid, "orders", orderId);
  await deleteDoc(ref);
}

// ═══ 예상 납기 프리셋 ═══
export const DELIVERY_ESTIMATES = [
  { value: "1~2일", label: "1~2일 내", desc: "후레싱/부자재 등 단순 상품" },
  { value: "3~5일", label: "3~5일 내", desc: "스윙도어/알루미늄 가공품" },
  { value: "5~7일", label: "5~7일 내", desc: "행가도어 (판넬 재고 있음)" },
  { value: "7~14일", label: "7~14일", desc: "행가도어 (판넬 제작 필요)" },
  { value: "14일이상", label: "14일 이상", desc: "대량 주문/특수 사양" },
  { value: "확인후안내", label: "확인 후 안내", desc: "별도 연락 드리겠습니다" },
];

// ═══ 택배사 목록 ═══
export const CARRIERS = [
  "CJ대한통운", "롯데택배", "한진택배", "로젠택배", "우체국택배", "경동택배", "기타",
];

// ═══ 전체 회원 조회 ═══
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const ref = collection(db, "users");
  const snap = await getDocs(ref);
  const users: AdminUser[] = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    // 해당 유저의 주문 수/총액 계산
    const ordersRef = collection(db, "users", docSnap.id, "orders");
    const ordersSnap = await getDocs(ordersRef);
    let totalSpent = 0;
    ordersSnap.forEach((o) => {
      totalSpent += o.data().totalAmount || 0;
    });

    users.push({
      uid: docSnap.id,
      email: data.email || "",
      displayName: data.displayName || data.name || "",
      provider: data.provider || "",
      createdAt: data.createdAt,
      lastLogin: data.lastLogin,
      orderCount: ordersSnap.size,
      totalSpent,
    });
  }

  return users;
}

// ═══ 매출 통계용 ═══
export interface SalesStat {
  date: string;       // YYYY-MM-DD
  orderCount: number;
  totalAmount: number;
}

export function aggregateSalesByDate(orders: AdminOrder[]): SalesStat[] {
  const map = new Map<string, SalesStat>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const date = order.createdAt
      ? new Date(order.createdAt.seconds * 1000).toISOString().slice(0, 10)
      : order.paidAt
        ? new Date(order.paidAt).toISOString().slice(0, 10)
        : "unknown";

    if (date === "unknown") continue;

    const existing = map.get(date) || { date, orderCount: 0, totalAmount: 0 };
    existing.orderCount += 1;
    existing.totalAmount += order.totalAmount;
    map.set(date, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateSalesByMonth(orders: AdminOrder[]): SalesStat[] {
  const map = new Map<string, SalesStat>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const month = order.createdAt
      ? new Date(order.createdAt.seconds * 1000).toISOString().slice(0, 7)
      : order.paidAt
        ? new Date(order.paidAt).toISOString().slice(0, 7)
        : "unknown";

    if (month === "unknown") continue;

    const existing = map.get(month) || { date: month, orderCount: 0, totalAmount: 0 };
    existing.orderCount += 1;
    existing.totalAmount += order.totalAmount;
    map.set(month, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
