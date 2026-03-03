/**
 * 결제 검증 API
 * ─────────────
 * 포트원 서버에 결제 내역을 조회하여
 * 실제 결제 금액과 주문 금액이 일치하는지 검증합니다.
 *
 * 흐름:
 * 1. 클라이언트에서 paymentId + 예상 금액 전달
 * 2. 포트원 API로 결제 내역 조회
 * 3. 금액 일치 + 결제 상태 확인
 * 4. 검증 성공/실패 응답
 */
import { NextResponse } from "next/server";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

export async function POST(req: Request) {
  try {
    const { paymentId, totalAmount } = await req.json();

    if (!paymentId || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터 누락" },
        { status: 400 }
      );
    }

    if (!PORTONE_API_SECRET) {
      console.error("PORTONE_API_SECRET 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { success: false, message: "서버 설정 오류" },
        { status: 500 }
      );
    }

    // 1. 포트원 V2 API로 결제 내역 조회
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}));
      console.error("포트원 API 조회 실패:", errorData);
      return NextResponse.json(
        { success: false, message: "결제 정보 조회 실패" },
        { status: 400 }
      );
    }

    const payment = await paymentResponse.json();

    // 2. 결제 상태 확인
    if (payment.status !== "PAID") {
      return NextResponse.json(
        { success: false, message: `결제가 완료되지 않았습니다. (상태: ${payment.status})` },
        { status: 400 }
      );
    }

    // 3. 금액 검증 (포트원에 기록된 금액 vs 우리 서버의 예상 금액)
    const paidAmount = payment.amount?.total;
    if (paidAmount !== totalAmount) {
      console.error(`금액 불일치: 결제=${paidAmount}, 예상=${totalAmount}`);
      return NextResponse.json(
        { success: false, message: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 4. 검증 성공
    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.id,
        status: payment.status,
        amount: paidAmount,
        method: payment.method?.type,
        paidAt: payment.paidAt,
        receiptUrl: payment.receiptUrl,
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
