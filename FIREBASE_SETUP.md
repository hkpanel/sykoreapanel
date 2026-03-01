# 🔥 Firebase 설정 가이드 (SY Korea Panel)

## Supabase → Firebase 전환 완료!

### 뭐가 바뀌었나요?

| 변경 전 (Supabase) | 변경 후 (Firebase) |
|---|---|
| 장바구니 → localStorage | 장바구니 → **Firestore** (실시간 동기화!) |
| 배송지 → localStorage | 배송지 → **Firestore** (실시간 동기화!) |
| Supabase Auth | **Firebase Auth** |
| 기기 바꾸면 데이터 사라짐 | **PC↔모바일 어디서든 같은 데이터** |

### 기존 유저 데이터는요?
- 기존 localStorage 데이터는 **자동 마이그레이션**됩니다
- 로그인하면 localStorage → Firestore로 한 번만 옮겨줌
- 이후에는 Firestore에서만 관리

---

## 📋 설정 순서

### 1단계: Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 (구글 계정 로그인)
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `sykoreapanel` (또는 원하는 이름)
4. Google Analytics → 켜도 되고 꺼도 됨 (상관없음)
5. **"프로젝트 만들기"** 클릭

### 2단계: 웹 앱 등록

1. 프로젝트 대시보드에서 **"</>"** (웹) 아이콘 클릭
2. 앱 닉네임: `SY Korea Panel Web`
3. **"앱 등록"** 클릭
4. 화면에 나오는 `firebaseConfig` 값을 복사!

```
예시:
  apiKey: "AIzaSyC..." ← 이런 값들이 나옴
  authDomain: "sykoreapanel.firebaseapp.com"
  projectId: "sykoreapanel"
  ...
```

### 3단계: .env.local 파일 만들기

프로젝트 루트에 `.env.local` 파일 만들고 아래 내용 넣기:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy여기에복사
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sykoreapanel.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sykoreapanel
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sykoreapanel.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=숫자복사
NEXT_PUBLIC_FIREBASE_APP_ID=1:숫자:web:문자열
```

### 4단계: Firebase Authentication 설정

1. Firebase 콘솔 왼쪽 메뉴 → **"Authentication"**
2. **"시작하기"** 클릭
3. **"Sign-in method"** 탭에서:
   - **이메일/비밀번호** → 사용 설정 ON
   - **Google** → 사용 설정 ON → 프로젝트 지원 이메일 선택 → 저장

### 5단계: Firestore Database 설정

1. Firebase 콘솔 왼쪽 메뉴 → **"Firestore Database"**
2. **"데이터베이스 만들기"** 클릭
3. 위치: **asia-northeast3 (서울)** 선택
4. 보안 규칙: **"테스트 모드에서 시작"** 선택 (나중에 보안 규칙 추가)
5. **"만들기"** 클릭

### 6단계: Firestore 보안 규칙 설정

Firestore → **"규칙"** 탭에서 아래로 교체:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 유저 자신의 데이터만 읽기/쓰기 가능
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**"게시"** 클릭

### 7단계: 실행!

```bash
npm install          # firebase 패키지 설치
npm run dev          # 개발 서버 시작
```

---

## 🏗️ 프로젝트 구조 (확장용)

```
src/
  lib/
    firebase.ts    ← Firebase 앱 초기화
    auth.ts        ← 인증 서비스 (로그인/회원가입/로그아웃)
    db.ts          ← DB 서비스 (장바구니/배송지/주문)
  app/
    components/
      AuthModal.tsx      ← 로그인/회원가입 모달
      MyPageModal.tsx    ← 마이페이지 (프로필 + 배송지)
      HangaDoorEstimator.tsx
      SwingDoorEstimator.tsx
    data/
      flashingProducts.ts
      hangaDoorData.ts
      swingDoorData.ts
      truckFees.ts
    page.tsx        ← 메인 페이지
```

### Firestore 데이터 구조

```
users/{uid}/              ← 유저 프로필 (이름, 연락처, 이메일)
  ├─ cart/{itemKey}       ← 장바구니 아이템 (실시간 동기화)
  ├─ addresses/{addrId}   ← 배송지 (실시간 동기화)
  └─ orders/{orderId}     ← 주문내역 (나중에 추가)
```

---

## ⏭️ 다음 작업 (TODO)

- [ ] 카카오 로그인 추가 (Next.js API Route + Firebase Custom Token)
- [ ] 네이버 로그인 추가
- [ ] 주문/결제 시스템
- [ ] 관리자 페이지
- [ ] SYC 토큰 결제 연동
