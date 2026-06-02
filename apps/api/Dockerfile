FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg curl build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p ./uploads ./recordings

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3001/api/docs || exit 1

CMD alembic upgrade head && \
    uvicorn main:socket_app --host 0.0.0.0 --port 3001 --workers 2
