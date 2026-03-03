# DeepStock Trading Engine — Cloud Run Dockerfile
# ────────────────────────────────────────────────
# 빌드: docker build -t deepstock-engine .
# 실행: docker run -p 8080:8080 deepstock-engine
# 배포: gcloud run deploy deepstock-engine --source .

FROM python:3.11-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# Cloud Run은 PORT 환경변수로 포트를 지정
ENV PORT=8080

# 실행
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
