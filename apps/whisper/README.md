# Avivavirtual Whisper Service

Self-hosted Faster Whisper service for post-call transcription in a Canadian deployment region such as DigitalOcean Toronto (`tor1`).

## Run Locally

```bash
cp .env.example .env
docker compose up --build
```

The API exposes:

- `GET /health`
- `GET /ready`
- `POST /transcribe` with `X-API-Key`

The default model is `faster-whisper medium`, which is retained on the `/app/models` volume after the first download.
