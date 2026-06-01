# AvivaVirtual Whisper Microservice

FastAPI service for Canadian-hosted call transcription. Deploy this container to DigitalOcean Toronto (`tor1`) when `WHISPER_PROVIDER=self-hosted` so audio stays in Canada.

## Run

```bash
cp .env.example .env
docker compose -f ../../docker-compose.whisper.yml up --build
```

The API requires `X-API-Key` matching `WHISPER_API_SECRET`, exposes `/health`, `/ready`, `/metrics`, and `/transcribe`, and converts every upload to 16 kHz mono WAV before faster-whisper inference.
