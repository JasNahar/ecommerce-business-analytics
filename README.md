# MachineMemory AI

MachineMemory AI is a local-first industrial maintenance knowledge system. It combines a Next.js web interface, a FastAPI agent service, specialist AI agents, Ollama, and durable knowledge storage.

The application does not require OpenAI, Azure OpenAI, or another cloud model provider. All inference is configured through local Ollama.

## System overview

```mermaid
flowchart LR
    U[Technician or Maintenance Engineer] -->|Symptom, manual text, or repair note| FE[Next.js Frontend]
    FE -->|Typed REST requests| API[FastAPI Backend]
    API --> M[Manager / Agent Router]

    M --> I[Machine Identification Agent]
    M --> T[Technician Memory Agent]
    M --> D[Fault Diagnosis Agent]
    M --> P[Spare Parts Agent]
    M --> C[Compatibility Agent]
    M --> S[Safety Review Agent]
    M --> K[Knowledge Curation Agent]

    I --> O[Ollama local LLM]
    T --> O
    D --> O
    P --> O
    S --> O

    API --> DB[(SQLite fallback)]
    DB -. optional future deployment .-> PG[(PostgreSQL + pgvector)]
    S --> H{Human approval gate}
    H -->|Approved| R[Approved repair recommendation]
    H -->|Rejected or pending| X[Held for review]
```

```mermaid
flowchart TD
    A[Input received] --> B[Manager validates request]
    B --> C[Machine identification]
    C --> D[Memory extraction]
    D --> E[Fault diagnosis]
    E --> F[Parts discovery]
    F --> G[Compatibility review]
    G --> H[Safety review]
    H --> I[Knowledge curation draft]
    I --> J[Agent trace shown in UI]
    J --> K{Qualified person approves?}
    K -->|No| L[Recommendation remains unapproved]
    K -->|Yes| M[Approval recorded]
```

## Core features

- Manager/orchestrator routes each request to specialist agents.
- Machine identification recognizes loom, carding, and drive equipment patterns.
- Technician-memory extraction converts free-text observations into reusable notes.
- Fault diagnosis ranks candidate root causes and evidence.
- Spare-parts discovery identifies candidates and confidence.
- Compatibility checking requires dimensional and OEM verification.
- Safety review blocks approval until a human completes the required controls.
- Knowledge curation creates a reviewable maintenance-memory draft.
- Agent traces show routing and status for every run.
- A human approval endpoint is separate from agent execution.

## Technology stack

| Component | Technology |
|---|---|
| Web application | Next.js 15, React 19, TypeScript, Tailwind CSS |
| API | Python 3.12, FastAPI, Pydantic |
| Agent orchestration | Python manager/router and specialist agent classes |
| Local inference | Ollama |
| Default persistence | SQLite |
| Optional vector persistence | PostgreSQL 16 with pgvector |
| Containers | Docker Compose |

## Repository layout

```text
src/app/page.tsx                 Next.js maintenance workspace
backend/app/main.py              FastAPI routes and API startup
backend/app/orchestrator.py      Manager and agent routing
backend/app/agents.py            Specialist agents
backend/app/ollama.py            Ollama API client
backend/app/db.py                SQLite connection and schema
backend/app/schemas.py           Typed API models
backend/tests/                  Focused backend tests
docker-compose.yml               Full local stack
postgres/init.sql                pgvector database initialization
.env.example                     Environment template
```

## Database and data storage

### SQLite default

The default configuration is the lightweight SQLite fallback. It requires no external database service.

Local development stores the database at:

```text
backend/machinememory.db
```

The database is initialized automatically when the FastAPI process starts. The schema creates:

- `machines`
- `memories`
- `parts`

Because `DATABASE_URL` is not yet consumed by the SQLite implementation, SQLite remains the active fallback in the MVP. The `DATABASE_URL` setting is reserved for a future PostgreSQL implementation.

### Docker Compose storage

Docker uses named volumes for data that must survive container replacement:

| Volume | Container location | Stores |
|---|---|---|
| `backend_data` | `/app/data` | SQLite database |
| `ollama_data` | `/root/.ollama` | Installed Ollama models |
| `postgres_data` | `/var/lib/postgresql/data` | Optional PostgreSQL database |

`backend_data` is mounted over `/app`, so data is retained when the backend container is rebuilt or recreated. It is not deleted by `docker compose down`.

Remove named data volumes only when the user explicitly wants a clean reset:

```bash
docker compose down -v
```

This deletes the SQLite, Ollama model, and optional PostgreSQL data volumes.

### PostgreSQL/pgvector-ready mode

The Compose profile starts PostgreSQL with the `pgvector` extension and initializes it with `postgres/init.sql`.

The credentials and database have documented defaults:

- Host from another container: `postgres`
- Host from the machine: `localhost`
- Port: `5432`
- Database: `machinememory`
- User: `machinememory`
- Password: `machinememory`

Example persisted vector configuration:

```dotenv
DATABASE_URL=postgresql://machinememory:machinememory@localhost:5432/machinememory
POSTGRES_DB=machinememory
POSTGRES_USER=machinememory
POSTGRES_PASSWORD=machinememory
```

> The current API implementation reads and writes SQLite. PostgreSQL is included for infrastructure readiness and future migration of embeddings and operational records. Production deployment must implement the PostgreSQL adapter and migration strategy before selecting it as the active data provider.

## Configuration

Copy the environment template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model used by all LLM agent calls |
| `DATABASE_URL` | `sqlite:///./machinememory.db` | Reserved persistence URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Browser-facing API URL |

No API keys or cloud model credentials are required.

## Ollama setup

### Native Ollama

Install Ollama and start the service:

```bash
ollama serve
```

Pull the default model:

```bash
ollama pull llama3.2
```

List and verify installed models:

```bash
ollama list
```

To use another model:

```bash
ollama pull mistral
```

Set `OLLAMA_MODEL=mistral` in `.env`, and restart the backend.

### Ollama in Docker Compose

Pull the model through the Ollama container:

```bash
docker compose exec ollama ollama pull llama3.2
```

## Local development

### 1. Install prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- Ollama

### 2. Start Ollama

```bash
ollama serve
```

### 3. Start the backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints:

- API health: `http://localhost:8000/api/health`
- API documentation: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

### 4. Start the frontend

Open a second terminal in the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker deployment

### Full local stack

From the repository root:

```bash
docker compose up --build -d
docker compose exec ollama ollama pull llama3.2
docker compose logs -f
```

Service URLs:

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend and Swagger | `http://localhost:8000/docs` |
| Ollama | `http://localhost:11434` |

Stop containers without deleting data:

```bash
docker compose down
```

Rebuild after source changes:

```bash
docker compose up --build -d
```

### Optional PostgreSQL profile

```bash
docker compose --profile postgres up --build -d
docker compose --profile postgres ps
```

The pgvector image initializes the `vector` extension through `postgres/init.sql`.

### Production deployment checklist

1. Run Ollama on a private or internal network reachable by the backend.
2. Set `OLLAMA_BASE_URL` to the deployed Ollama service DNS name or URL.
3. Set a pinned `OLLAMA_MODEL` and run `ollama pull` during image initialization or release provisioning.
4. Put PostgreSQL behind a private network; do not expose port `5432` publicly.
5. Replace the SQLite fallback with a PostgreSQL migration and adapter for multi-instance deployments.
6. Put HTTPS termination in front of Next.js and FastAPI.
7. Replace wildcard CORS configuration with the deployed frontend origin.
8. Store database credentials in a secrets manager rather than `.env`.
9. Back up Ollama model storage and database volumes before upgrades.
10. Configure log collection and metrics for API latency and agent failures.
11. Keep human approval out of unattended automation until an authenticated authorization workflow exists.

For a small on-premises deployment, Docker Compose is sufficient. For multiple hosts or high availability, deploy the frontend, backend, PostgreSQL, pgvector, and Ollama to separate container services or Kubernetes resources. Mount durable volumes for Ollama models and PostgreSQL data.

## Human approval boundary

Agents create hypotheses and drafts. They do not approve repair work.

The UI presents safety and compatibility concerns and requires an explicit human action before a run is marked approved. Production deployment should add:

- Authentication and role-based authorization
- Approval audit records
- Technician and approver identity
- Machine revision and exact submitted evidence
- Timestamp and signature
- Retention policy for sensitive maintenance records

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health and provider status |
| `GET` | `/api/machines` | List machines |
| `POST` | `/api/machines` | Create a machine |
| `GET` | `/api/memories` | List repair memories |
| `POST` | `/api/memories` | Save a memory draft |
| `POST` | `/api/memories/{id}/approve` | Approve a stored memory |
| `GET` | `/api/parts` | List spare-part candidates |
| `POST` | `/api/parts` | Add a spare-part record |
| `POST` | `/api/agent-runs` | Route text through all specialist agents |
| `POST` | `/api/agent-runs/{run_id}/approve` | Record explicit human approval |

## Tests

Backend tests cover health and manager routing:

```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest -q
```

Frontend production build:

```bash
npm run build
```
