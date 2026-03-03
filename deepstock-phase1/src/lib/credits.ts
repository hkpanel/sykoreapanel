/**
 * 충전금(크레딧) 시스템 — Firestore
 * ────────────────────────────────────
 * 고객이 원화 또는 SYC로 충전 → 매매 시마다 수수료 차감
 *
 * Firestore 구조:
 *   users/{uid}/credits/{id}
 *     - type: "charge" | "deduct" | "refund"
 *     - method: "portone" | "syc" | "system"
 *     - amount: number (양수: 충전, 음수: 차감)
 *     - balance: number (이 거래 후 잔액)
 *     - desc: string
 *     - tradeId?: string (차감인 경우 연결된 매매ID)
 *     - txHash?: string (SYC 결제인 경우 트랜잭션 해시)
 *     - createdAt: Timestamp
 *
 * 📌 src/lib/credits.ts 에 배치
 */

import { useState, useEffect } from "react";
import {
  collection, doc, setDoc, getDocs, onSnapshot,
  query, orderBy, limit, serverTimestamp,
  runTransaction, getDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ═══════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════

export interface CreditRecord {
  id: string;
  type: "charge" | "deduct" | "refund";
  method: "portone" | "syc" | "system";
  amount: number;       // 양수: 충전, 음수: 차감
  balance: number;      // 거래 후 잔액
  desc: string;
  tradeId?: string;
  txHash?: string;
  paymentId?: string;   // PortOne 결제 ID
  createdAt?: unknown;
}

export interface CreditBalance {
  total: number;        // 현재 잔액
  totalCharged: number; // 총 충전액
  totalUsed: number;    // 총 사용액
}

// ═══════════════════════════════════════
//  수수료 설정
// ═══════════════════════════════════════

/** 매매 수수료율 (거래금액 대비) */
export const TRADE_FEE_RATE = 0.001;  // 0.1% (주식 수수료 수준)

/** SYC 결제 할인율 */
export const SYC_DISCOUNT_RATE = 0.25; // 25% 할인

/** 최소 충전금 (원화) */
export const MIN_CHARGE_KRW = 10000;  // 1만원

/** 수수료 계산 */
export function calcTradeFee(tradeAmount: number): number {
  return Math.max(100, Math.ceil(tradeAmount * TRADE_FEE_RATE)); // 최소 100원
}

// ═══════════════════════════════════════
//  잔액 조회
// ═══════════════════════════════════════

/** 잔액 문서 경로 */
function balanceRef(uid: string) {
  return doc(db, "users", uid, "credits", "_balance");
}

/** 현재 잔액 가져오기 */
export async function getCreditBalance(uid: string): Promise<CreditBalance> {
  const snap = await getDoc(balanceRef(uid));
  if (snap.exists()) {
    const data = snap.data();
    return {
      total: data.total || 0,
      totalCharged: data.totalCharged || 0,
      totalUsed: data.totalUsed || 0,
    };
  }
  return { total: 0, totalCharged: 0, totalUsed: 0 };
}

/** 잔액 실시간 구독 */
export function subscribeCreditBalance(
  uid: string,
  callback: (balance: CreditBalance) => void,
): Unsubscribe {
  return onSnapshot(balanceRef(uid), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        total: data.total || 0,
        totalCharged: data.totalCharged || 0,
        totalUsed: data.totalUsed || 0,
      });
    } else {
      callback({ total: 0, totalCharged: 0, totalUsed: 0 });
    }
  });
}

/** React 훅: 잔액 실시간 구독 */
export function useCreditBalance(uid: string | null) {
  const [balance, setBalance] = useState<CreditBalance>({ total: 0, totalCharged: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = subscribeCreditBalance(uid, (b) => {
      setBalance(b);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return { ...balance, loading };
}

// ═══════════════════════════════════════
//  충전 (charge)
// ═══════════════════════════════════════

/** 충전금 충전 (원화 또는 SYC) */
export async function chargeCredits(
  uid: string,
  amount: number,
  method: "portone" | "syc",
  opts?: { paymentId?: string; txHash?: string; desc?: string },
): Promise<CreditRecord> {
  if (amount <= 0) throw new Error("충전 금액은 0보다 커야 합니다");

  const recordId = `chg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const colRef = collection(db, "users", uid, "credits");

  // 트랜잭션으로 잔액 업데이트 + 이력 추가 (동시성 안전)
  const record = await runTransaction(db, async (tx) => {
    const balSnap = await tx.get(balanceRef(uid));
    const current = balSnap.exists() ? (balSnap.data().total || 0) : 0;
    const totalCharged = balSnap.exists() ? (balSnap.data().totalCharged || 0) : 0;
    const newBalance = current + amount;

    // 잔액 업데이트
    tx.set(balanceRef(uid), {
      total: newBalance,
      totalCharged: totalCharged + amount,
      totalUsed: balSnap.exists() ? (balSnap.data().totalUsed || 0) : 0,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // 이력 추가
    const rec: CreditRecord = {
      id: recordId,
      type: "charge",
      method,
      amount,
      balance: newBalance,
      desc: opts?.desc || (method === "syc" ? "SYC 코인 충전" : "원화 충전"),
      paymentId: opts?.paymentId,
      txHash: opts?.txHash,
    };
    tx.set(doc(colRef, recordId), { ...rec, createdAt: serverTimestamp() });
    return rec;
  });

  return record;
}

// ═══════════════════════════════════════
//  차감 (deduct) — 매매 수수료
// ═══════════════════════════════════════

/** 매매 수수료 차감 */
export async function deductTradeFee(
  uid: string,
  tradeAmount: number,
  tradeId: string,
  desc?: string,
): Promise<{ success: boolean; fee: number; balance: number; error?: string }> {
  const fee = calcTradeFee(tradeAmount);

  try {
    const result = await runTransaction(db, async (tx) => {
      const balSnap = await tx.get(balanceRef(uid));
      const current = balSnap.exists() ? (balSnap.data().total || 0) : 0;

      if (current < fee) {
        throw new Error(`충전금 부족 (잔액: ${current.toLocaleString()}원, 수수료: ${fee.toLocaleString()}원)`);
      }

      const newBalance = current - fee;
      const totalUsed = balSnap.exists() ? (balSnap.data().totalUsed || 0) : 0;

      // 잔액 업데이트
      tx.set(balanceRef(uid), {
        total: newBalance,
        totalUsed: totalUsed + fee,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 이력 추가
      const recordId = `ded_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const colRef = collection(db, "users", uid, "credits");
      tx.set(doc(colRef, recordId), {
        id: recordId,
        type: "deduct",
        method: "system",
        amount: -fee,
        balance: newBalance,
        desc: desc || `매매 수수료 (거래금액 ₩${tradeAmount.toLocaleString()})`,
        tradeId,
        createdAt: serverTimestamp(),
      });

      return { success: true, fee, balance: newBalance };
    });

    return result;
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { success: false, fee, balance: 0, error: e.message || "차감 실패" };
  }
}

/** 잔액이 수수료를 감당할 수 있는지 확인 */
export async function canAffordTrade(uid: string, tradeAmount: number): Promise<boolean> {
  const fee = calcTradeFee(tradeAmount);
  const balance = await getCreditBalance(uid);
  return balance.total >= fee;
}

// ═══════════════════════════════════════
//  이력 조회
// ═══════════════════════════════════════

/** 최근 충전금 이력 가져오기 */
export function subscribeCreditHistory(
  uid: string,
  callback: (records: CreditRecord[]) => void,
  maxRecords = 50,
): Unsubscribe {
  const ref = collection(db, "users", uid, "credits");
  const q = query(ref, orderBy("createdAt", "desc"), limit(maxRecords));
  return onSnapshot(q, (snap) => {
    const records: CreditRecord[] = [];
    snap.forEach((d) => {
      const data = d.data();
      // _balance 문서는 제외
      if (d.id !== "_balance") {
        records.push({ id: d.id, ...data } as CreditRecord);
      }
    });
    callback(records);
  });
}
