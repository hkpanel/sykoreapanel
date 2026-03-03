/**
 * 텔레그램 알림 API
 * POST /api/notify
 * 
 * 환경변수:
 *   TELEGRAM_BOT_TOKEN  — BotFather에서 받은 토큰
 *   TELEGRAM_CHAT_ID    — 관리자 chat_id
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("텔레그램 설정 없음 — 알림 건너뜀");
      return NextResponse.json({ ok: true, skipped: true });
    }

    let message = "";

    if (type === "new_order") {
      const d = data;
      const itemSummary = d.items?.length > 0
        ? `${d.items[0].productName}${d.items.length > 1 ? ` 외 ${d.items.length - 1}건` : ""}`
        : "상품";
      const payIcon = d.payMethod === "무통장입금" ? "🏦" : d.payMethod === "SYC" ? "🪙" : "💳";
      const deliveryIcon = d.deliveryType === "parcel" ? "📦" : d.deliveryType === "truck" ? "🚛" : "🚗";
      const needsInquiry = d.estimatedDelivery?.includes("확인 필요");

      message = [
        `🔔 *새 주문 접수!*`,
        ``,
        `${payIcon} *${d.payMethod}* · ${deliveryIcon} ${d.deliveryType === "parcel" ? "택배" : d.deliveryType === "truck" ? "용차" : "직접수령"}`,
        `📦 ${itemSummary}`,
        `💰 *₩${Number(d.totalAmount).toLocaleString()}*`,
        ``,
        `👤 ${d.userName || "이름없음"} (${d.userEmail || ""})`,
        d.addressFull ? `📍 ${d.addressFull}` : "",
        d.addressPhone ? `📞 ${d.addressPhone}` : "",
        ``,
        `⏱ 예상납기: ${d.estimatedDelivery || "미정"}`,
        needsInquiry ? `⚠️ *납기 확인 필요!*` : "",
        d.deliveryNote ? `📝 ${d.deliveryNote}${d.preferredDate ? ` (${d.preferredDate})` : ""}` : "",
        d.customerMemo ? `💬 ${d.customerMemo}` : "",
        ``,
        `🔗 [관리자 페이지 열기](https://sykoreapanel.com/admin/orders)`,
      ].filter(Boolean).join("\n");
    }

    else if (type === "status_change") {
      const d = data;
      message = [
        `📋 *주문 상태 변경*`,
        ``,
        `${d.orderName || "주문"} → *${d.newStatus}*`,
        `💰 ₩${Number(d.totalAmount).toLocaleString()}`,
        `👤 ${d.userName || ""}`,
      ].filter(Boolean).join("\n");
    }

    else if (type === "delivery_inquiry") {
      const d = data;
      message = [
        `⚠️ *납기 확인 요청!*`,
        ``,
        `📦 ${d.itemSummary || "상품"}`,
        `👤 ${d.userName || ""} (${d.userEmail || ""})`,
        `📞 ${d.userPhone || "연락처없음"}`,
        `💰 ₩${Number(d.totalAmount).toLocaleString()}`,
        ``,
        `🔗 [관리자 페이지에서 납기 입력](https://sykoreapanel.com/admin/orders)`,
      ].filter(Boolean).join("\n");
    }

    if (!message) {
      return NextResponse.json({ ok: false, error: "알 수 없는 알림 타입" });
    }

    // 텔레그램 메시지 전송
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error("텔레그램 전송 실패:", result);
    }

    return NextResponse.json({ ok: result.ok });
  } catch (err) {
    console.error("알림 API 에러:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
