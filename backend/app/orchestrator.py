from uuid import uuid4

from .agents import (
    CompatibilityAgent,
    FaultDiagnosisAgent,
    KnowledgeCurationAgent,
    MachineIdentificationAgent,
    SafetyReviewAgent,
    SparePartsAgent,
    TechnicianMemoryAgent,
)


class AgentRouter:
    """Routes a maintenance request through the specialist agents."""

    def __init__(self):
        self.machine = MachineIdentificationAgent()
        self.memory = TechnicianMemoryAgent()
        self.diagnosis = FaultDiagnosisAgent()
        self.parts = SparePartsAgent()
        self.compatibility = CompatibilityAgent()
        self.safety = SafetyReviewAgent()
        self.curation = KnowledgeCurationAgent()

    async def run(self, text: str, machine_name: str = "") -> dict:
        machine = await self.machine.run(text, machine_name)
        memory = await self.memory.run(text)
        diagnosis = await self.diagnosis.run(text)
        parts = await self.parts.run(text)
        compatibility = await self.compatibility.run(parts["suggestions"])
        safety = await self.safety.run(text)
        curation = await self.curation.run(text, machine)

        traces = [
            {"agent": "Manager / Orchestrator", "status": "completed", "summary": "Request received and routed"},
            {"agent": self.machine.name, "status": "completed", "summary": f"Identified {machine['name']}"},
            {"agent": self.memory.name, "status": "completed", "summary": "Technician knowledge extracted"},
            {"agent": self.diagnosis.name, "status": "attention", "summary": "One or more hypotheses require field verification"},
            {"agent": self.parts.name, "status": "completed", "summary": f"Found {len(parts['suggestions'])} candidate(s)"},
            {"agent": self.compatibility.name, "status": "attention", "summary": "Compatibility is not yet approved"},
            {"agent": self.safety.name, "status": "blocked", "summary": "Human safety approval required"},
            {"agent": self.curation.name, "status": "attention", "summary": "Memory draft held for review"},
        ]
        return {
            "run_id": str(uuid4()),
            "machine": machine,
            "memory": memory,
            "diagnosis": diagnosis,
            "parts": parts["suggestions"],
            "compatibility": compatibility,
            "safety": safety,
            "curation": curation,
            "traces": traces,
            "approved": False,
        }
