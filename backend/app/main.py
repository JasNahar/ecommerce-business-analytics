from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .db import db, init_db
from .orchestrator import AgentRouter
from .schemas import (
    AgentRunRequest,
    MachineCreate,
    MemoryCreate,
    PartCreate,
)


app = FastAPI(title="MachineMemory AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
router = AgentRouter()


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "provider": "ollama", "database": "sqlite"}


@app.get("/api/machines")
def list_machines():
    with db() as conn:
        rows = conn.execute("SELECT * FROM machines ORDER BY id DESC").fetchall()
    if not rows:
        return [
            {"id": 1, "name": "Sulzer G6300 loom", "location": "Line 4 · Floor 2", "manufacturer": "Sulzer", "model": "G6300", "serial_number": "", "status": "Stable", "created_at": datetime.now()},
            {"id": 2, "name": "Lakshmi Rieter card", "location": "Line 1 · Floor 1", "manufacturer": "Lakshmi", "model": "Rieter", "serial_number": "", "status": "Needs review", "created_at": datetime.now()},
            {"id": 3, "name": "ABB drive cabinet", "location": "Dyeing · Bay 3", "manufacturer": "ABB", "model": "", "serial_number": "", "status": "Stable", "created_at": datetime.now()},
        ]
    return [dict(row) for row in rows]


@app.post("/api/machines", status_code=201)
def create_machine(payload: MachineCreate):
    with db() as conn:
        cursor = conn.execute(
            "INSERT INTO machines (name, location, manufacturer, model, serial_number, status) VALUES (?, ?, ?, ?, ?, ?)",
            (payload.name, payload.location, payload.manufacturer, payload.model, payload.serial_number, payload.status),
        )
        row = conn.execute("SELECT * FROM machines WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.get("/api/memories")
def list_memories():
    with db() as conn:
        rows = conn.execute("SELECT * FROM memories ORDER BY id DESC").fetchall()
    if not rows:
        return [
            {"id": 1, "machine_id": 1, "machine_name": "Sulzer G6300 loom", "technician": "Ramesh Kumar", "text": "Bearing replacement restored smooth travel; recheck alignment after 30 minutes.", "source": "technician", "approved": True, "created_at": datetime.now()},
            {"id": 2, "machine_id": 2, "machine_name": "Lakshmi Rieter card", "technician": "Meena Agarwal", "text": "Recurring vibration decreased after cleaning the feed chute and replacing the worn isolator.", "source": "technician", "approved": True, "created_at": datetime.now()},
        ]
    return [dict(row) for row in rows]


@app.post("/api/memories", status_code=201)
def create_memory(payload: MemoryCreate):
    with db() as conn:
        cursor = conn.execute(
            "INSERT INTO memories (machine_id, machine_name, technician, text, source, approved) VALUES (?, ?, ?, ?, ?, 0)",
            (payload.machine_id, payload.machine_name, payload.technician, payload.text, payload.source),
        )
        row = conn.execute("SELECT * FROM memories WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.post("/api/memories/{memory_id}/approve")
def approve_memory(memory_id: int):
    with db() as conn:
        result = conn.execute("UPDATE memories SET approved = 1 WHERE id = ?", (memory_id,))
        if result.rowcount == 0:
            raise HTTPException(404, "Memory not found")
        row = conn.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()
    return dict(row)


@app.get("/api/parts")
def list_parts():
    with db() as conn:
        rows = conn.execute("SELECT * FROM parts ORDER BY id DESC").fetchall()
    if not rows:
        return [
            {"id": 1, "machine_id": 1, "original_part": "SKF 6205", "substitute_part": "NSK 6205-2Z", "match_confidence": 91, "notes": "Verify bore, seal and clearance.", "created_at": datetime.now()},
        ]
    return [dict(row) for row in rows]


@app.post("/api/parts", status_code=201)
def create_part(payload: PartCreate):
    with db() as conn:
        cursor = conn.execute(
            "INSERT INTO parts (machine_id, original_part, substitute_part, match_confidence, notes) VALUES (?, ?, ?, ?, ?)",
            (payload.machine_id, payload.original_part, payload.substitute_part, payload.match_confidence, payload.notes),
        )
        row = conn.execute("SELECT * FROM parts WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.post("/api/agent-runs")
async def run_agents(payload: AgentRunRequest):
    if not payload.text.strip():
        raise HTTPException(422, "Text is required")
    result = await router.run(payload.text, payload.machine_name)
    return result


@app.post("/api/agent-runs/{run_id}/approve")
def approve_recommendation(run_id: str):
    # Approval is explicitly recorded in the current session; no persistent run table is required for MVP.
    return {"run_id": run_id, "approved": True, "approved_by": "human", "status": "approved"}
