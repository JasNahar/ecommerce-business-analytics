# MachineMemory AI

MachineMemory AI is a local-first maintenance knowledge MVP for industrial teams. It combines a Next.js/TypeScript UI with a FastAPI agent service and Ollama. Cloud model APIs are not used.

## Features

- Manager agent routes requests to machine identification, technician-memory extraction, fault diagnosis, spare-parts discovery, compatibility checking, safety review, and knowledge-curation specialists
- Machine, repair-memory, and spare-parts panels
- Text entry and text-file upload for evidence
- Visible agent trace and explicit human approval gate
- SQLite fallback; PostgreSQL/pgvector is ready in Docker Compose
- Ollama-only model provider

## Prerequisites

- Python 3.11+
- Node.js 20+
- Ollama installed locally
- Docker with Compose (optional; recommended for the full stack)

## Ollama model

Install Ollama, start it, and pull the configured model:

```bash
ollama pull llama3.2
```

The default model is `llama3.2`. Override it with `OLLAMA_MODEL`.

## Local development

Copy environment defaults:

```bash
cp .env.example .env
```

Windows PowerShell can instead copy the file manually.

Start Ollama:

```bash
ollama serve
```

Start the backend:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in another terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. API docs are available at `http://localhost:8000/docs`.

## Docker Compose

```bash
docker compose up --build
docker exec machinememory-ai-ollama-1 ollama pull llama3.2
```

The container name may differ on your Docker installation; use `docker compose exec ollama ollama pull llama3.2` instead.

```bash
docker compose exec ollama ollama pull llama3.2
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`
Ollama: `http://localhost:11434`

To run optional PostgreSQL/pgvector:

```bash
docker compose --profile postgres up --build
```

Set `DATABASE_URL=postgresql://machinememory:machinememory@postgres:5432/machinememory` if extending the implementation to PostgreSQL. The MVP currently uses the safe SQLite fallback. The pgvector database and `vector` extension are initialized for later embeddings.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model |
| `DATABASE_URL` | `sqlite:///./machinememory.db` | Persistence URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Browser-facing API |

## Architecture

```text
Next.js UI
  -> FastAPI typed REST API
       -> Manager / AgentRouter
            -> Machine identification
            -> Technician memory extraction
            -> Fault diagnosis
            -> Spare-parts discovery
            -> Compatibility checking
            -> Safety review
            -> Knowledge curation
       -> Ollama (only LLM provider)
       -> SQLite fallback / optional PostgreSQL + pgvector
```

No recommendation is marked approved by an agent. The frontend approval endpoint is intentionally separate and can only be triggered by a human action.

## Tests

```bash
cd backend
python -m pip install -r requirements.txt
pytest -q
```

Focused tests cover the health endpoint and manager routing behavior.
