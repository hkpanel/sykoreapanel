"""
한국투자증권 Open API 클라이언트
══════════════════════════════════
REST API 호출 래퍼

참고: https://apiportal.koreainvestment.com
GitHub: https://github.com/koreainvestment/open-trading-api

📌 trading-engine/kis_client.py
"""

import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class KisClient:
    """한국투자증권 Open API 클라이언트"""

    # 실전투자 / 모의투자 베이스 URL
    BASE_URL_REAL = "https://openapi.koreainvestment.com:9443"
    BASE_URL_VIRTUAL = "https://openapivts.koreainvestment.com:29443"

    def __init__(
        self,
        hts_id: str,
        app_key: str,
        app_secret: str,
        account_no: str,
        is_virtual: bool = False,
    ):
        self.hts_id = hts_id
        self.app_key = app_key
        self.app_secret = app_secret
        self.account_no = account_no  # "00000000-01" 형식
        self.is_virtual = is_virtual
        self.base_url = self.BASE_URL_VIRTUAL if is_virtual else self.BASE_URL_REAL

        # 토큰 관리
        self._access_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None

    # ─── 토큰 발급 ───

    async def _get_token(self) -> str:
        """접근 토큰 발급 (24시간 유효, 자동 갱신)"""
        # 유효한 토큰이 있으면 재사용
        if self._access_token and self._token_expires and datetime.now() < self._token_expires:
            return self._access_token

        url = f"{self.base_url}/oauth2/tokenP"
        body = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body)
            res.raise_for_status()
            data = res.json()

        self._access_token = data["access_token"]
        # 토큰 만료 23시간 후로 설정 (안전 마진)
        self._token_expires = datetime.now() + timedelta(hours=23)
        return self._access_token

    # ─── 공통 헤더 ───

    async def _headers(self, tr_id: str) -> Dict[str, str]:
        """API 호출 공통 헤더"""
        token = await self._get_token()
        return {
            "Content-Type": "application/json; charset=utf-8",
            "authorization": f"Bearer {token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id,
        }

    # ─── 계좌번호 파싱 ───

    @property
    def _acct_prefix(self) -> str:
        """계좌번호 앞 8자리"""
        return self.account_no.split("-")[0]

    @property
    def _acct_suffix(self) -> str:
        """계좌번호 뒤 2자리"""
        return self.account_no.split("-")[1] if "-" in self.account_no else "01"

    # ═══════════════════════════════════════
    #  국내주식 현재가 조회
    # ═══════════════════════════════════════

    async def get_price(self, stock_code: str) -> Dict[str, Any]:
        """
        국내주식 현재가 조회
        tr_id: FHKST01010100
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        headers = await self._headers("FHKST01010100")
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 주식
            "FID_INPUT_ISCD": stock_code,
        }

        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        if data.get("rt_cd") != "0":
            raise Exception(f"API 에러: {data.get('msg1', '알 수 없는 오류')}")

        output = data["output"]
        return {
            "code": stock_code,
            "name": output.get("hts_kor_isnm", ""),
            "price": int(output.get("stck_prpr", 0)),
            "change": int(output.get("prdy_vrss", 0)),
            "change_rate": float(output.get("prdy_ctrt", 0)),
            "volume": int(output.get("acml_vol", 0)),
            "high": int(output.get("stck_hgpr", 0)),
            "low": int(output.get("stck_lwpr", 0)),
        }

    # ═══════════════════════════════════════
    #  잔고 조회
    # ═══════════════════════════════════════

    async def get_balance(self) -> Dict[str, Any]:
        """
        국내주식 잔고 조회
        tr_id: TTTC8434R (실전) / VTTC8434R (모의)
        """
        tr_id = "VTTC8434R" if self.is_virtual else "TTTC8434R"
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-balance"
        headers = await self._headers(tr_id)
        params = {
            "CANO": self._acct_prefix,
            "ACNT_PRDT_CD": self._acct_suffix,
            "AFHR_FLPR_YN": "N",
            "OFL_YN": "",
            "INQR_DVSN": "02",
            "UNPR_DVSN": "01",
            "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N",
            "PRCS_DVSN": "01",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": "",
        }

        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        if data.get("rt_cd") != "0":
            raise Exception(f"잔고 조회 실패: {data.get('msg1', '')}")

        holdings = []
        for item in data.get("output1", []):
            if int(item.get("hldg_qty", 0)) > 0:
                holdings.append({
                    "code": item.get("pdno", ""),
                    "name": item.get("prdt_name", ""),
                    "qty": int(item.get("hldg_qty", 0)),
                    "avg_price": int(float(item.get("pchs_avg_pric", 0))),
                    "cur_price": int(item.get("prpr", 0)),
                    "eval_amount": int(item.get("evlu_amt", 0)),
                    "profit": int(item.get("evlu_pfls_amt", 0)),
                    "profit_rate": float(item.get("evlu_pfls_rt", 0)),
                })

        summary = data.get("output2", [{}])[0] if data.get("output2") else {}
        return {
            "holdings": holdings,
            "total_eval": int(summary.get("tot_evlu_amt", 0)),
            "total_purchase": int(summary.get("pchs_amt_smtl_amt", 0)),
            "total_profit": int(summary.get("evlu_pfls_smtl_amt", 0)),
            "cash": int(summary.get("dnca_tot_amt", 0)),
        }

    # ═══════════════════════════════════════
    #  매수/매도 주문
    # ═══════════════════════════════════════

    async def order(
        self,
        stock_code: str,
        order_type: str,  # "buy" | "sell"
        qty: int,
        price: int = 0,   # 0이면 시장가
    ) -> Dict[str, Any]:
        """
        국내주식 주문
        tr_id:
          매수 — TTTC0802U (실전) / VTTC0802U (모의)
          매도 — TTTC0801U (실전) / VTTC0801U (모의)
        """
        if order_type == "buy":
            tr_id = "VTTC0802U" if self.is_virtual else "TTTC0802U"
        else:
            tr_id = "VTTC0801U" if self.is_virtual else "TTTC0801U"

        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-cash"
        headers = await self._headers(tr_id)

        # 시장가 or 지정가
        ord_dvsn = "01" if price == 0 else "00"  # 01=시장가, 00=지정가

        body = {
            "CANO": self._acct_prefix,
            "ACNT_PRDT_CD": self._acct_suffix,
            "PDNO": stock_code,
            "ORD_DVSN": ord_dvsn,
            "ORD_QTY": str(qty),
            "ORD_UNPR": str(price) if price > 0 else "0",
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=body)
            res.raise_for_status()
            data = res.json()

        if data.get("rt_cd") != "0":
            raise Exception(f"주문 실패: {data.get('msg1', '')}")

        output = data.get("output", {})
        return {
            "order_no": output.get("ODNO", ""),
            "order_time": output.get("ORD_TMD", ""),
            "stock_code": stock_code,
            "order_type": order_type,
            "qty": qty,
            "price": price,
        }

    # ═══════════════════════════════════════
    #  일봉 데이터 조회 (차트 분석용)
    # ═══════════════════════════════════════

    async def get_daily_prices(
        self,
        stock_code: str,
        start_date: str,  # YYYYMMDD
        end_date: str,    # YYYYMMDD
    ) -> list:
        """
        국내주식 일봉 데이터 조회
        tr_id: FHKST01010400
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price"
        headers = await self._headers("FHKST01010400")
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_DATE_1": start_date,
            "FID_INPUT_DATE_2": end_date,
            "FID_PERIOD_DIV_CODE": "D",
            "FID_ORG_ADJ_PRC": "0",  # 수정주가
        }

        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        candles = []
        for item in data.get("output2", []):
            if item.get("stck_bsop_date"):
                candles.append({
                    "date": item["stck_bsop_date"],
                    "open": int(item.get("stck_oprc", 0)),
                    "high": int(item.get("stck_hgpr", 0)),
                    "low": int(item.get("stck_lwpr", 0)),
                    "close": int(item.get("stck_clpr", 0)),
                    "volume": int(item.get("acml_vol", 0)),
                })
        return candles
