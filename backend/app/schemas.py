from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class MachineCreate(BaseModel):
    name: str
    location: str
    manufacturer: str = ""
    model: str = ""
    serial_number: str = ""
    status: Literal["Stable", "Needs review", "Offline"] = "Stable"


class Machine(BaseModel):
    id: int
    name: str
    location: str
    manufacturer: str
    model: str
    serial_number: str
    status: str
    created_at: datetime


class MemoryCreate(BaseModel):
    machine_id: int | None = None
    machine_name: str = ""
    technician: str = ""
    text: str
    source: Literal["technician", "manual", "observation"] = "technician"


class Memory(BaseModel):
    id: int
    machine_id: int | None
    machine_name: str
    technician: str
    text: str
    source: str
    approved: bool
    created_at: datetime


class PartCreate(BaseModel):
    machine_id: int | None = None
    original_part: str
    substitute_part: str
    match_confidence: int = Field(ge=0, le=100)
    notes: str = ""


class Part(BaseModel):
    id: int
    machine_id: int | None
    original_part: str
    substitute_part: str
    match_confidence: int
    notes: str
    created_at: datetime


class AgentRunRequest(BaseModel):
    text: str
    machine_id: int | None = None
    machine_name: str = ""
    attachment_name: str | None = None


class TraceStep(BaseModel):
    agent: str
    status: Literal["completed", "attention", "blocked"]
    summary: str


class AgentRunResponse(BaseModel):
    run_id: str
    machine: dict[str, Any]
    diagnosis: dict[str, Any]
    parts: list[dict[str, Any]]
    safety: dict[str, Any]
    traces: list[TraceStep]
    approved: bool = False
