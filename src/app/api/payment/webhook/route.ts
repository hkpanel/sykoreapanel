/**
 * 아임포트 웹훅 API
 * ─────────────
 * 결제 상태 변경 시 아임포트에서 자동으로 호출
 * (결제 완료, 취소, 환불 등)
 *
 * 포트원 관리자 → [결제 연동] → [Webhook] 에서 등록:
 * https://sykoreapanel.com/api/payment/webhook
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const IMP_KEY = process.env.IMP_KEY;
const IMP_SECRET = process.env.IMP_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 텔레그램 알림 헬퍼
async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("텔레그램 전송 실패:", err);
  }
}

// 아임포트 액세스 토큰 발급
async function getImpToken(): Promise<string | null> {
  if (!IMP_KEY || !IMP_SECRET) return null;
  const res = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imp_key: IMP_KEY, imp_secret: IMP_SECRET }),
  });
  const data = await res.json();
  return data.code === 0 ? data.response.access_token : null;
}

// 모든 유저의 orders에서 주문 찾기 (인덱스 불필요)
async function findOrder(merchantUid: string, impUid: string) {
  const usersSnap = await adminDb.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const ordersSnap = await adminDb
      .collection("users").doc(userDoc.id)
      .collection("orders")
      .where("id", "==", merchantUid)
      .get();
    if (!ordersSnap.empty) {
      return ordersSnap.docs[0];
    }
    // id로 못 찾으면 paymentId로
    const ordersSnap2 = await adminDb
      .collection("users").doc(userDoc.id)
      .collection("orders")
      .where("paymentId", "==", impUid)
      .get();
    if (!ordersSnap2.empty) {
      return ordersSnap2.docs[0];
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imp_uid, merchant_uid } = body;

    if (!imp_uid) {
      return NextResponse.json({ success: false, message: "imp_uid 누락" }, { status: 400 });
    }

    // 1. 아임포트에서 결제 상태 조회
    const token = await getImpToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "인증 실패" }, { status: 500 });
    }

    const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: token },
    });
    const paymentData = await paymentRes.json();
    if (paymentData.code !== 0) {
      return NextResponse.json({ success: false, message: "결제 조회 실패" }, { status: 400 });
    }

    const payment = paymentData.response;
    const status = payment.status; // paid, cancelled, failed, ready

    // 2. Firestore에서 해당 주문 찾기
    const orderDoc = await findOrder(merchant_uid || payment.merchant_uid, imp_uid);
    if (!orderDoc) {
      console.log(`웹훅: 주문 못 찾음 (merchant_uid: ${merchant_uid}, imp_uid: ${imp_uid})`);
      return NextResponse.json({ success: true, message: "주문 없음 (무시)" });
    }

    // 3. 상태 매핑
    const statusMap: Record<string, string> = {
      paid: "paid",
      cancelled: "cancelled",
      failed: "failed",
      ready: "pending",
    };
    const newStatus = statusMap[status] || status;
    const data = orderDoc.data();

    // 같은 상태면 무시
    if (data.status === newStatus) {
      return NextResponse.json({ success: true, message: "상태 동일 (무시)" });
    }

    // 4. Firestore 업데이트
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (status === "cancelled") {
      updateData.cancelledAt = new Date().toISOString();
      updateData.cancelReason = payment.cancel_reason || "PG 취소";
    }

    const history = data.statusHistory || [];
    history.push({ status: newStatus, at: new Date().toISOString() });
    updateData.statusHistory = history;

    await orderDoc.ref.update(updateData);

    // 5. 텔레그램 알림
    const itemSummary = data.items?.length > 0
      ? `${data.items[0].productName}${data.items.length > 1 ? ` 외 ${data.items.length - 1}건` : ""}`
      : "상품";

    const statusEmoji: Record<string, string> = { cancelled: "❌", failed: "⚠️", paid: "✅", pending: "⏳" };
    const statusLabel: Record<string, string> = { cancelled: "결제 취소", failed: "결제 실패", paid: "결제 완료", pending: "입금 대기" };

    await sendTelegram([
      `${statusEmoji[newStatus] || "📋"} *${statusLabel[newStatus] || newStatus}*`,
      ``,
      `📦 ${itemSummary}`,
      `💰 ₩${Number(data.totalAmount).toLocaleString()}`,
      status === "cancelled" ? `📝 사유: ${payment.cancel_reason || "없음"}` : "",
      ``,
      `🔗 [관리자 페이지](https://sykoreapanel.com/admin/orders)`,
    ].filter(Boolean).join("\n"));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("웹훅 처리 오류:", err);
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
