"""
SY.ai DeepStock 트레이딩 엔진
═══════════════════════════════
FastAPI 서버 — Google Cloud Run 배포용

기능:
  1. 한국투자증권 API 연동 (토큰 발급, 잔고조회, 주문)
  2. 전략 실행 스케줄러
  3. 매매 시 Firestore에 이력 기록 + 충전금 차감 요청

📌 trading-engine/main.py
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI(
    title="DeepStock Trading Engine",
    description="SY.ai 자동매매 엔진",
    version="0.1.0",
)

# CORS 설정 (프론트엔드 도메인 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://syai.co.kr",
        "https://www.syai.co.kr",
        "http://localhost:3000",  # 개발용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════
#  요청/응답 모델
# ═══════════════════════════════════════

class KisConfigRequest(BaseModel):
    """한투 API키 등록 요청"""
    uid: str
    hts_id: str
    app_key: str
    app_secret: str
    account_no: str
    is_virtual: bool = False  # 모의투자 여부


class OrderRequest(BaseModel):
    """주문 요청"""
    uid: str
    stock_code: str
    order_type: str   # "buy" | "sell"
    qty: int
    price: int = 0    # 0이면 시장가


class StrategyRequest(BaseModel):
    """전략 시작/정지 요청"""
    uid: str
    strategy_id: str
    action: str  # "start" | "stop"


# ═══════════════════════════════════════
#  헬스체크
# ═══════════════════════════════════════

@app.get("/")
async def root():
    return {"service": "DeepStock Trading Engine", "status": "running", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ═══════════════════════════════════════
#  한투 API키 등록
# ═══════════════════════════════════════

@app.post("/api/kis/register")
async def register_kis_config(req: KisConfigRequest):
    """
    고객의 한투 API키를 암호화하여 Firestore에 저장
    TODO: AES 암호화 적용, Firebase Admin SDK 연동
    """
    # Phase 1-3에서 구현
    return {
        "success": True,
        "message": f"API키 등록 완료 (계좌: {req.account_no})",
        "is_virtual": req.is_virtual,
    }


# ═══════════════════════════════════════
#  잔고 조회
# ═══════════════════════════════════════

@app.get("/api/kis/balance/{uid}")
async def get_balance(uid: str):
    """
    고객 계좌 잔고 조회
    TODO: 한투 API 실제 호출
    """
    # Phase 1-3에서 구현 — 지금은 모의 데이터
    return {
        "success": True,
        "data": {
            "total_eval": 12450000,
            "total_profit": 510000,
            "profit_rate": 4.28,
            "cash": 2350000,
            "holdings": [
                {"code": "005930", "name": "삼성전자", "qty": 10, "avg_price": 72000, "cur_price": 74500},
                {"code": "000660", "name": "SK하이닉스", "qty": 5, "avg_price": 185000, "cur_price": 192000},
            ],
        },
    }


# ═══════════════════════════════════════
#  주문 실행
# ═══════════════════════════════════════

@app.post("/api/kis/order")
async def execute_order(req: OrderRequest):
    """
    매수/매도 주문 실행
    TODO: 한투 API 실제 호출 + 충전금 차감
    """
    # Phase 1-3에서 구현
    return {
        "success": True,
        "data": {
            "order_no": "0000012345",
            "stock_code": req.stock_code,
            "order_type": req.order_type,
            "qty": req.qty,
            "price": req.price or 74500,  # 시장가인 경우 현재가
            "fee_charged": 149,  # 충전금에서 차감된 수수료
        },
    }


# ═══════════════════════════════════════
#  전략 실행/정지
# ═══════════════════════════════════════

@app.post("/api/strategy/control")
async def control_strategy(req: StrategyRequest):
    """
    전략 시작 또는 정지
    TODO: 스케줄러 등록/해제
    """
    # Phase 1-4에서 구현
    return {
        "success": True,
        "strategy_id": req.strategy_id,
        "action": req.action,
        "message": f"전략 {req.action} 완료",
    }


# ═══════════════════════════════════════
#  실행 (로컬 개발용)
# ═══════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
