# SY.ai - DeepStock 개발 로드맵

## 프로젝트 개요
- **서비스명:** DeepStock (SY.ai 첫 번째 AI 투자 서비스)
- **방식:** 고객이 본인 한국투자증권 API키를 등록 → 서버에서 자동매매 전략 실행
- **과금:** 충전금(크레딧) 방식 — 매수/매도 체결 시 거래금액의 일정% 차감
- **결제:** 원화(PortOne) + SYC코인(MetaMask) 모두 지원, SYC 결제 시 20~30% 할인
- **인프라:** 기존 sykoreapanel 프로젝트에 확장, Google Cloud 통합 운영

---

## 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | Next.js 16 + React 19 + Tailwind 4 | 기존 프로젝트 확장 |
| 인증 | Firebase Auth | 기존 재활용 (카카오/네이버/구글/이메일) |
| DB | Firebase Firestore | 기존 재활용, 컬렉션 추가 |
| 결제 | PortOne(원화) + SYC(MetaMask) | 기존 재활용, 충전금 시스템 추가 |
| 트레이딩 엔진 | Python FastAPI + KIS Open API | Cloud Run 배포 |
| 스케줄러 | Cloud Scheduler + Cloud Tasks | 장중 자동 실행 |
| 실시간 알림 | Firebase FCM + 텔레그램 | 체결/잔고 알림 |
| 도메인 | syai.co.kr → SY.ai, sykoreapanel.kr → 쇼핑몰 | 미들웨어로 분기 |

---

## Firestore 컬렉션 설계 (신규 추가분)

```
users/{uid}/credits/{id}         ← 충전금 이력 (충전/차감)
users/{uid}/kis-config            ← 한투 API 설정 (암호화 저장)
users/{uid}/deepstock-config      ← DeepStock 전략 설정
users/{uid}/trades/{id}           ← 매매 이력
users/{uid}/portfolio             ← 현재 포트폴리오 스냅샷
strategies/{id}                   ← 제공 전략 목록 (관리자 등록)
```

---

## 개발 Phase

### Phase 1-1: 플랫폼 기본 틀 ← 현재 작업
- [x] 미들웨어 (도메인 분기)
- [x] SY.ai 레이아웃 (다크 테마)
- [x] SY.ai 메인 랜딩 페이지
- [x] DeepStock 대시보드 기본 UI
- [x] 충전금(크레딧) 시스템 Firestore 유틸

### Phase 1-2: 충전금 결제 연동
- [ ] 충전금 충전 페이지 (원화 + SYC)
- [ ] PortOne 충전 결제 연동
- [ ] SYC 코인 충전 연동 (기존 syc-payment.ts 활용)
- [ ] 충전금 잔액 표시 + 이력 조회

### Phase 1-3: 한투 API 연동 (Python 백엔드)
- [ ] FastAPI 서버 기본 구조
- [ ] 한투 API 토큰 발급/갱신
- [ ] 잔고 조회 / 현재가 조회
- [ ] 매수/매도 주문 실행
- [ ] Dockerfile + Cloud Run 배포

### Phase 1-4: 전략 엔진 (첫 번째 전략)
- [ ] 리밸런싱 + 차트매매 혼합 전략 구현
- [ ] 전략 설정 UI (종목선택, 비율, 매매조건)
- [ ] 모의투자 테스트
- [ ] 매매 시 충전금 자동 차감

### Phase 1-5: 대시보드 고도화
- [ ] 실시간 포트폴리오 현황
- [ ] 수익률 차트 (일/주/월)
- [ ] 매매 이력 상세
- [ ] 체결 알림 (FCM + 텔레그램)

---

## 보안 주의사항
- 고객 한투 API키는 **서버 사이드에서만 복호화**, Firestore에는 AES 암호화 저장
- API키는 프론트엔드에 절대 노출 금지
- Cloud Run ↔ Firestore 간 통신은 서비스 계정 인증
- 매매 실행 로그 전수 기록 (감사 추적)
