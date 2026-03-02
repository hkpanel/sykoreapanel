/**
 * 관리자 전용 Firestore 서비스
 * ─────────────────────────────
 * collectionGroup으로 전체 유저의 주문을 한번에 조회
 * 관리자 이메일: bbajae1@naver.com
 */
import {
  collection, collectionGroup, getDocs, doc, updateDoc,
  query, orderBy,
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
  id: string;          // Firestore doc ID
  uid: string;         // 주문한 유저 UID
  paymentId: string;
  orderName?: string;
  status: "paid" | "preparing" | "shipping" | "delivered" | "cancelled";
  items: {
    productName: string;
    size: string;
    color: string;
    colorSub?: string;
    retailPrice: number;
    qty: number;
    category?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  payMethod: string;
  deliveryType: string;
  addressId?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt?: Timestamp;
  // 유저 정보 (조인)
  userEmail?: string;
  userName?: string;
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
  const q = query(
    collectionGroup(db, "orders"),
    orderBy("createdAt", "desc"),
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
      receiptUrl: data.receiptUrl,
      paidAt: data.paidAt,
      createdAt: data.createdAt,
    });
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
