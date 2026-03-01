"use client";
import { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile } from "@/lib/auth";
import {
  subscribeAddresses, saveAddress, deleteAddress, setDefaultAddress,
  type Address,
} from "@/lib/db";
import type { User } from "firebase/auth";

interface MyPageModalProps {
  user: User;
  initialTab?: "info" | "address";
  onClose: () => void;
}

export default function MyPageModal({ user, initialTab = "info", onClose }: MyPageModalProps) {
  const [tab, setTab] = useState<"info" | "address">(initialTab);
  const [name, setName] = useState(user.displayName || "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 배송지
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editAddr, setEditAddr] = useState<Address | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);

  // Firestore에서 프로필 로드
  useEffect(() => {
    getUserProfile(user.uid).then(profile => {
      if (profile) {
        if (profile.name) setName(profile.name);
        if (profile.phone) setPhone(profile.phone);
      }
    });
  }, [user.uid]);

  // Firestore 배송지 실시간 구독 (PC↔모바일 동기화!)
  useEffect(() => {
    const unsub = subscribeAddresses(user.uid, (addrs) => {
      setAddresses(addrs);
    });
    return () => unsub();
  }, [user.uid]);

  const handleSaveInfo = async () => {
    setSaving(true);
    setMsg("");
    try {
      await updateUserProfile(user.uid, { name, phone });
      setMsg("저장했어요!");
    } catch {
      setMsg("저장 실패. 다시 시도해주세요.");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleSaveAddr = async (addr: Address) => {
    // 기본 배송지로 설정한 경우
    if (addr.isDefault) {
      await setDefaultAddress(user.uid, addr.id);
    }
    await saveAddress(user.uid, addr);
    // 첫 배송지면 자동으로 기본 배송지
    if (addresses.length === 0) {
      addr.isDefault = true;
      await saveAddress(user.uid, addr);
    }
    setShowAddrForm(false);
    setEditAddr(null);
  };

  const handleDeleteAddr = async (id: string) => {
    await deleteAddress(user.uid, id);
    // 기본 배송지가 삭제된 경우 첫 번째를 기본으로
    const remaining = addresses.filter(a => a.id !== id);
    if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
      await setDefaultAddress(user.uid, remaining[0].id);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(user.uid, id);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "2px solid #e8e8ed", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const,
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: "10px 0", border: "none", borderBottom: active ? "3px solid #7b5ea7" : "3px solid transparent",
    background: "none", cursor: "pointer", fontSize: 14, fontWeight: active ? 800 : 600,
    color: active ? "#7b5ea7" : "#86868b", transition: "all 0.2s",
  });

  // 로그인 방식 표시
  const providerLabel = (() => {
    const pid = user.providerData[0]?.providerId;
    if (pid === "google.com") return "🔵 구글";
    if (pid === "password") return "📧 이메일";
    return "📧 이메일";
  })();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, width: "calc(100% - 32px)", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1d1d1f", margin: 0 }}>마이페이지</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "#f5f5f7", fontSize: 16, cursor: "pointer", color: "#86868b" }}>✕</button>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", padding: "12px 24px 0", borderBottom: "1px solid #f0f0f2" }}>
          <button onClick={() => setTab("info")} style={tabStyle(tab === "info")}>👤 회원정보</button>
          <button onClick={() => setTab("address")} style={tabStyle(tab === "address")}>📦 배송지 관리</button>
        </div>

        <div style={{ padding: "20px 24px 28px" }}>

          {/* 회원정보 탭 */}
          {tab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>로그인 방식</label>
                <div style={{ padding: "11px 14px", borderRadius: 10, background: "#f5f5f7", fontSize: 14, color: "#1d1d1f", fontWeight: 600 }}>
                  {providerLabel}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>이메일</label>
                <div style={{ padding: "11px 14px", borderRadius: 10, background: "#f5f5f7", fontSize: 14, color: "#86868b" }}>
                  {user.email || "이메일 없음"}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>이름</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>연락처</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
              </div>
              {msg && <div style={{ padding: "8px 12px", borderRadius: 8, background: msg.includes("실패") ? "#fde8e8" : "#e8f8f0", color: msg.includes("실패") ? "#e34040" : "#0f8a6c", fontSize: 13, fontWeight: 600 }}>{msg}</div>}
              <button onClick={handleSaveInfo} disabled={saving}
                style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 14, background: "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}

          {/* 배송지 관리 탭 */}
          {tab === "address" && !showAddrForm && (
            <div>
              {addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#86868b" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>등록된 배송지가 없어요</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>배송지를 추가해주세요!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {addresses.map(a => (
                    <div key={a.id} style={{ padding: "14px 16px", borderRadius: 14, border: a.isDefault ? "2px solid #7b5ea7" : "2px solid #e8e8ed", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#1d1d1f" }}>{a.label}</span>
                        {a.isDefault && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#7b5ea7", padding: "2px 8px", borderRadius: 8 }}>기본</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#1d1d1f", fontWeight: 600 }}>{a.name} · {a.phone}</div>
                      <div style={{ fontSize: 12, color: "#86868b", marginTop: 2 }}>({a.zipcode}) {a.address1} {a.address2}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button onClick={() => { setEditAddr(a); setShowAddrForm(true); }}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e8e8ed", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1d1d1f" }}>수정</button>
                        <button onClick={() => handleDeleteAddr(a.id)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fde8e8", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#e34040" }}>삭제</button>
                        {!a.isDefault && <button onClick={() => handleSetDefault(a.id)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e8e8ed", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#7b5ea7" }}>기본 배송지로</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setEditAddr(null); setShowAddrForm(true); }}
                style={{ width: "100%", marginTop: 14, padding: "14px 0", border: "2px dashed #d0d0d5", borderRadius: 14, background: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#7b5ea7" }}>
                + 배송지 추가
              </button>
            </div>
          )}

          {/* 배송지 입력 폼 */}
          {tab === "address" && showAddrForm && (
            <AddressForm addr={editAddr} onSave={handleSaveAddr} onCancel={() => { setShowAddrForm(false); setEditAddr(null); }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* 배송지 입력 폼 서브 컴포넌트 */
function AddressForm({ addr, onSave, onCancel }: { addr: Address | null; onSave: (a: Address) => void; onCancel: () => void }) {
  const [label, setLabel] = useState(addr?.label || "");
  const [name, setName] = useState(addr?.name || "");
  const [phone, setPhone] = useState(addr?.phone || "");
  const [zipcode, setZipcode] = useState(addr?.zipcode || "");
  const [address1, setAddress1] = useState(addr?.address1 || "");
  const [address2, setAddress2] = useState(addr?.address2 || "");
  const [isDefault, setIsDefault] = useState(addr?.isDefault || false);

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "2px solid #e8e8ed", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const,
  };

  const openPostcode = () => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          setZipcode(data.zonecode);
          setAddress1(data.roadAddress || data.jibunAddress);
          setTimeout(() => {
            const el = document.getElementById("addr2-input");
            if (el) el.focus();
          }, 100);
        },
      }).open();
    };
    document.body.appendChild(script);
  };

  const handleSubmit = () => {
    if (!label || !name || !phone || !address1) return;
    onSave({
      id: addr?.id || `addr_${Date.now()}`,
      label, name, phone, zipcode, address1, address2, isDefault,
    });
  };

  const quickLabels = ["집", "회사", "현장"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={onCancel} style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#7b5ea7", padding: 0 }}>
        ← 목록으로
      </button>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>배송지 이름 *</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          {quickLabels.map(q => (
            <button key={q} onClick={() => setLabel(q)}
              style={{ padding: "6px 14px", borderRadius: 8, border: label === q ? "2px solid #7b5ea7" : "2px solid #e8e8ed", background: label === q ? "rgba(123,94,167,0.06)" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: label === q ? "#7b5ea7" : "#86868b" }}>{q}</button>
          ))}
        </div>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="예: 평택 현장" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>받는 분 *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>연락처 *</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>주소 *</label>
        <button onClick={openPostcode}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #7b5ea7", background: "rgba(123,94,167,0.04)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#7b5ea7", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
          🔍 {zipcode ? `(${zipcode}) ${address1}` : "주소 검색하기"}
        </button>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 4, display: "block" }}>상세주소</label>
        <input id="addr2-input" type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="동/호수, 건물명 등" style={inputStyle} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#7b5ea7" }} />
        기본 배송지로 설정
      </label>
      <button onClick={handleSubmit} disabled={!label || !name || !phone || !address1}
        style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 14, background: (!label || !name || !phone || !address1) ? "#e0e0e0" : "linear-gradient(135deg, #7b5ea7, #3ee6c4)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: (!label || !name || !phone || !address1) ? "default" : "pointer" }}>
        {addr ? "수정 완료" : "배송지 추가"}
      </button>
    </div>
  );
}
