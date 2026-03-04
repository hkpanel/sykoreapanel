/**
 * 결제 검증 API (아임포트 V1)
 * ─────────────
 * 아임포트 서버에 결제 내역을 조회하여
 * 실제 결제 금액과 주문 금액이 일치하는지 검증합니다.
 */
import { NextResponse } from "next/server";

const IMP_KEY = process.env.IMP_KEY;
const IMP_SECRET = process.env.IMP_SECRET;

export async function POST(req: Request) {
  try {
    const { imp_uid, merchant_uid, totalAmount } = await req.json();

    if (!imp_uid || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터 누락" },
        { status: 400 }
      );
    }

    if (!IMP_KEY || !IMP_SECRET) {
      console.error("IMP_KEY 또는 IMP_SECRET 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { success: false, message: "서버 설정 오류" },
        { status: 500 }
      );
    }

    // 1. 아임포트 액세스 토큰 발급
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: IMP_KEY, imp_secret: IMP_SECRET }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) {
      console.error("아임포트 토큰 발급 실패:", tokenData);
      return NextResponse.json(
        { success: false, message: "결제 인증 실패" },
        { status: 500 }
      );
    }
    const accessToken = tokenData.response.access_token;

    // 2. 아임포트 결제 내역 조회
    const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: accessToken },
    });

    const paymentData = await paymentRes.json();
    if (paymentData.code !== 0) {
      console.error("아임포트 결제 조회 실패:", paymentData);
      return NextResponse.json(
        { success: false, message: "결제 정보 조회 실패" },
        { status: 400 }
      );
    }

    const payment = paymentData.response;

    // 3. 결제 상태 확인
    if (payment.status !== "paid") {
      return NextResponse.json(
        { success: false, message: `결제가 완료되지 않았습니다. (상태: ${payment.status})` },
        { status: 400 }
      );
    }

    // 4. 금액 검증
    if (payment.amount !== totalAmount) {
      console.error(`금액 불일치: 결제=${payment.amount}, 예상=${totalAmount}`);
      return NextResponse.json(
        { success: false, message: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 5. 검증 성공
    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.merchant_uid,
        impUid: payment.imp_uid,
        status: payment.status,
        amount: payment.amount,
        method: payment.pay_method,
        paidAt: payment.paid_at ? new Date(payment.paid_at * 1000).toISOString() : new Date().toISOString(),
        receiptUrl: payment.receipt_url,
      },
    });
  } catch (err) {
    console.error("결제 검증 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
