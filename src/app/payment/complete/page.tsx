"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");
  const [message, setMessage] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      // 포트원 리다이렉트 후 쿼리 파라미터로 paymentId가 전달됨
      const paymentId = searchParams.get("paymentId");
      const code = searchParams.get("code"); // 에러 코드 (취소/실패 시)

      // 사용자가 결제를 취소한 경우
      if (code === "USER_CANCEL" || code) {
        setStatus("fail");
        setMessage(code === "USER_CANCEL" ? "결제가 취소되었습니다." : `결제 실패: ${searchParams.get("message") || "알 수 없는 오류"}`);
        return;
      }

      if (!paymentId) {
        setStatus("fail");
        setMessage("결제 정보를 찾을 수 없습니다.");
        return;
      }

      // sessionStorage에서 주문 정보 복원
      const pendingRaw = sessionStorage.getItem("pendingOrder");
      if (!pendingRaw) {
        setStatus("fail");
        setMessage("주문 정보를 찾을 수 없습니다. 홈으로 돌아가주세요.");
        return;
      }
      const pending = JSON.parse(pendingRaw);

      try {
        // 서버에서 결제 검증
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, totalAmount: pending.totalAmount }),
        });
        const verifyResult = await verifyRes.json();

        if (!verifyResult.success) {
          setStatus("fail");
          setMessage(`결제 검증 실패: ${verifyResult.message}`);
          return;
        }

        // Firestore에 주문 저장
        const { getAuth } = await import("firebase/auth");
        const { getFirestore, collection, addDoc, serverTimestamp, deleteDoc, getDocs } = await import("firebase/firestore");
        const firebaseModule = await import("@/lib/firebase");
        const app = firebaseModule.default;
        const auth = getAuth(app);
        const db = getFirestore(app);
        const user = auth.currentUser;

        if (user) {
          await addDoc(collection(db, "users", user.uid, "orders"), {
            paymentId,
            totalAmount: pending.totalAmount,
            orderName: pending.orderName,
            items: pending.cartSnapshot,
            delivery: pending.delivery,
            deliveryFee: pending.deliveryFee,
            address: pending.selectedAddrId || null,
            truckRegion: pending.truckRegion || null,
            receiptUrl: verifyResult.payment?.receiptUrl || null,
            status: "paid",
            createdAt: serverTimestamp(),
          });

          // 장바구니 비우기
          const cartSnap = await getDocs(collection(db, "users", user.uid, "cart"));
          for (const doc of cartSnap.docs) {
            await deleteDoc(doc.ref);
          }
        }

        // 성공
        setStatus("success");
        setReceiptUrl(verifyResult.payment?.receiptUrl || null);
        sessionStorage.removeItem("pendingOrder");
      } catch (err) {
        console.error("결제 검증 오류:", err);
        setStatus("fail");
        setMessage("결제 처리 중 오류가 발생했습니다.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f5f5f7", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 32px", maxWidth: 400,
        width: "100%", textAlign: "center", boxShadow: "0 4px 30px rgba(0,0,0,0.08)",
      }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1d1d1f", marginBottom: 8 }}>결제 확인 중...</div>
            <div style={{ fontSize: 14, color: "#86868b" }}>잠시만 기다려주세요</div>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1d1d1f", marginBottom: 8 }}>결제가 완료되었습니다!</div>
            <div style={{ fontSize: 14, color: "#86868b", marginBottom: 24 }}>
              주문이 정상적으로 접수되었어요.<br />감사합니다!
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {receiptUrl && (
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{
                  padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: "#f5f5f7", color: "#1d1d1f", textDecoration: "none", display: "block",
                }}>
                  🧾 영수증 보기
                </a>
              )}
              <Link href="/" style={{
                padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 800,
                background: "#1d1d1f", color: "#fff", textDecoration: "none", display: "block",
              }}>
                🏠 홈으로 돌아가기
              </Link>
            </div>
          </>
        )}

        {status === "fail" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e34040", marginBottom: 8 }}>
              {message || "결제에 실패했습니다"}
            </div>
            <div style={{ fontSize: 14, color: "#86868b", marginBottom: 24 }}>
              다시 시도하시거나 카톡으로 문의해주세요.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/" style={{
                padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 800,
                background: "#1d1d1f", color: "#fff", textDecoration: "none", display: "block",
              }}>
                🏠 홈으로 돌아가기
              </Link>
              <a href="http://pf.kakao.com/_vDxfmn/chat" target="_blank" rel="noopener noreferrer" style={{
                padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: "#FAE100", color: "#3C1E1E", textDecoration: "none", display: "block",
              }}>
                💬 카톡으로 문의하기
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1d1d1f" }}>결제 확인 중...</div>
        </div>
      </div>
    }>
      <PaymentCompleteContent />
    </Suspense>
  );
}
