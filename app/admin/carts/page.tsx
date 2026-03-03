"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CartItemData {
  key: string;
  productId?: string;
  productName: string;
  size: string;
  color: string;
  colorSub?: string;
  retailPrice: number;
  qty: number;
  category?: string;
}

interface UserCart {
  uid: string;
  email: string;
  displayName: string;
  items: CartItemData[];
  totalAmount: number;
  itemCount: number;
}

export default function AdminCarts() {
  const [userCarts, setUserCarts] = useState<UserCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  useEffect(() => {
    let unsubs: Unsubscribe[] = [];

    const load = async () => {
      try {
        // 1) 전체 유저 목록 가져오기
        const usersSnap = await getDocs(collection(db, "users"));
        const usersMap = new Map<string, { email: string; displayName: string }>();

        usersSnap.forEach((doc) => {
          const d = doc.data();
          usersMap.set(doc.id, {
            email: d.email || "",
            displayName: d.displayName || d.name || "",
          });
        });

        // 2) 각 유저의 장바구니를 실시간 구독
        const cartsMap = new Map<string, UserCart>();

        for (const [uid, info] of usersMap) {
          const cartRef = collection(db, "users", uid, "cart");
          const unsub = onSnapshot(cartRef, (snap) => {
            const items: CartItemData[] = [];
            snap.forEach((doc) => items.push(doc.data() as CartItemData));

            if (items.length > 0) {
              const totalAmount = items.reduce((s, i) => s + i.retailPrice * i.qty, 0);
              cartsMap.set(uid, {
                uid,
                email: info.email,
                displayName: info.displayName,
                items,
                totalAmount,
                itemCount: items.reduce((s, i) => s + i.qty, 0),
              });
            } else {
              cartsMap.delete(uid);
            }

            // 금액 높은 순으로 정렬해서 상태 업데이트
            const sorted = Array.from(cartsMap.values())
              .sort((a, b) => b.totalAmount - a.totalAmount);
            setUserCarts(sorted);
          });
          unsubs.push(unsub);
        }

        setLoading(false);
      } catch (err) {
        console.error("장바구니 조회 실패:", err);
        setLoading(false);
      }
    };

    load();
    return () => unsubs.forEach((u) => u());
  }, []);

  const filtered = search.trim()
    ? userCarts.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : userCarts;

  const formatKRW = (n: number) => n.toLocaleString("ko-KR") + "원";

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 16, color: "#86868b" }}>장바구니 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>고객 장바구니</h1>
        <p style={{ fontSize: 14, color: "#86868b" }}>
          현재 장바구니에 상품이 있는 고객 {userCarts.length}명 · 실시간 업데이트
        </p>
      </div>

      {/* 검색 - 카톡 문의 온 고객 찾기용 */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 고객 이름 또는 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 420, padding: "12px 16px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "#f5f5f7", fontSize: 14, outline: "none",
          }}
        />
        {search && (
          <span style={{ fontSize: 13, color: "#86868b", marginLeft: 12 }}>
            {filtered.length}명 검색됨
          </span>
        )}
      </div>

      {/* 장바구니 목록 */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", color: "#86868b", fontSize: 14,
          background: "rgba(255,255,255,0.03)", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {search ? "검색 결과가 없습니다" : "장바구니에 상품을 담은 고객이 없습니다"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((uc) => {
            const isExpanded = expandedUid === uc.uid;
            return (
              <div key={uc.uid} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                {/* 요약 행 */}
                <div
                  onClick={() => setExpandedUid(isExpanded ? null : uc.uid)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    cursor: "pointer", flexWrap: "wrap",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: "rgba(59,130,246,0.1)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>
                    🛒
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {uc.displayName || "(이름 없음)"}
                    </div>
                    <div style={{ fontSize: 12, color: "#86868b" }}>{uc.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>
                      {formatKRW(uc.totalAmount)}
                    </div>
                    <div style={{ fontSize: 11, color: "#86868b" }}>
                      {uc.items.length}종 · {uc.itemCount}개
                    </div>
                  </div>
                  <span style={{
                    fontSize: 16, transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }}>▾</span>
                </div>

                {/* 상세 장바구니 */}
                {isExpanded && (
                  <div style={{
                    padding: "0 18px 18px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ marginTop: 12 }}>
                      {uc.items.map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                          borderRadius: 10, marginBottom: 6, fontSize: 13,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{item.productName}</div>
                            <div style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>
                              {item.size} / {item.color}
                              {item.colorSub ? ` (${item.colorSub})` : ""}
                              {item.category ? ` · ${
                                item.category === "flashing" ? "후레싱" :
                                item.category === "swing" ? "스윙도어" :
                                item.category === "hanga" ? "행가도어" : item.category
                              }` : ""}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", whiteSpace: "nowrap", marginLeft: 16 }}>
                            <div style={{ fontWeight: 700 }}>
                              {formatKRW(item.retailPrice * item.qty)}
                            </div>
                            <div style={{ fontSize: 11, color: "#86868b" }}>
                              {formatKRW(item.retailPrice)} × {item.qty}개
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 합계 */}
                    <div style={{
                      display: "flex", justifyContent: "flex-end", alignItems: "center",
                      gap: 12, padding: "12px 14px", marginTop: 4,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <span style={{ fontSize: 13, color: "#86868b", fontWeight: 600 }}>
                        합계 (부가세 별도)
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "#f5f5f7" }}>
                        {formatKRW(uc.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
