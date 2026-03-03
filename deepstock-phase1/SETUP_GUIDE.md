# DeepStock Phase 1-1 설치 가이드

## 📂 파일 배치 안내

이 폴더의 파일들을 기존 sykoreapanel 프로젝트에 아래처럼 배치하세요.

```
sykoreapanel/
├── src/
│   ├── middleware.ts           ← 🆕 새 파일 (도메인 분기)
│   ├── app/
│   │   ├── ai/                ← 🆕 새 폴더
│   │   │   ├── layout.tsx     ← 🆕 SY.ai 레이아웃
│   │   │   ├── page.tsx       ← 🆕 SY.ai 메인
│   │   │   └── deepstock/
│   │   │       └── page.tsx   ← 🆕 DeepStock 대시보드
│   │   ├── page.tsx           (기존 - 수정 없음)
│   │   └── ...                (기존 - 수정 없음)
│   └── lib/
│       ├── credits.ts         ← 🆕 충전금 시스템
│       ├── auth.ts            (기존 - 수정 없음)
│       ├── db.ts              (기존 - 수정 없음)
│       └── ...                (기존 - 수정 없음)
│
├── trading-engine/            ← 🆕 새 폴더 (Python 백엔드)
│   ├── main.py
│   ├── kis_client.py
│   ├── strategies/            (Phase 1-4에서 추가)
│   ├── requirements.txt
│   └── Dockerfile
│
└── package.json               (기존 - 수정 없음)
```

## 🚀 실행 방법

### 1. 프론트엔드 (기존과 동일)
```bash
cd sykoreapanel
npm run dev
```
→ http://localhost:3000/ai 에서 SY.ai 확인 가능

### 2. 트레이딩 엔진 (새로 추가)
```bash
cd trading-engine
pip install -r requirements.txt
python main.py
```
→ http://localhost:8080 에서 API 서버 확인

### 3. Cloud Run 배포 (나중에)
```bash
cd trading-engine
gcloud run deploy deepstock-engine --source . --region asia-northeast3
```

## 📝 기존 코드 수정 필요 사항

### 수정 없음!
기존 sykoreapanel 쇼핑몰 코드는 **전혀 수정하지 않습니다.**
새 파일만 추가하면 됩니다.

Next.js의 파일 기반 라우팅 덕분에:
- `/ai` 경로 → src/app/ai/page.tsx 자동 연결
- `/ai/deepstock` → src/app/ai/deepstock/page.tsx 자동 연결
- 기존 `/` 경로 → src/app/page.tsx 그대로 유지

## ⏭ 다음 단계 (Phase 1-2)

충전금 충전 페이지 + 결제 연동
- /ai/credits/charge 페이지 추가
- PortOne 결제 연동 (기존 코드 활용)
- SYC 코인 충전 연동 (기존 syc-payment.ts 활용)
