FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p ./uploads ./recordings && chown -R app:app /app
USER app

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3001/api/docs || exit 1

CMD python -m alembic -c alembic.ini upgrade head && \
    python -m uvicorn main:socket_app --host 0.0.0.0 --port 3001 --workers 1
