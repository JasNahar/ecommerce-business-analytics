import re

from .ollama import generate


def _ollama_text(text: str, system: str) -> str:
    # Kept synchronous for deterministic router tests; the service calls async internally
    import asyncio
    return asyncio.run(generate(text, system))


class MachineIdentificationAgent:
    name = "Machine Identification"

    async def run(self, text: str, machine_name: str = ""):
        machine = {"name": machine_name or "Unidentified machine", "confidence": 72}
        if re.search(r"loom|loam", text, re.I):
            machine.update(name=machine_name or "Sulzer G6300 loom", type="Loom", confidence=88)
        if re.search(r"drive|abb|motor", text, re.I):
            machine.update(name=machine_name or "ABB drive cabinet", type="Variable-speed drive", confidence=84)
        if re.search(r"card|ricter|riet(er|a)", text, re.I):
            machine.update(name=machine_name or "Lakshmi Rieter card", type="Textile carding machine", confidence=86)
        response = await generate(
            f"Identify the machine type and known model from this text: {text}",
            "You are an industrial machine identification specialist. Be concise and evidence-based.",
        )
        if response:
            machine["model_note"] = response
        return machine


class TechnicianMemoryAgent:
    name = "Technician Memory"

    async def run(self, text: str):
        extracted = await generate(
            f"Extract the key maintenance action, observations, tools, and parts from: {text}",
            "Extract usable technician knowledge. Return a short structured summary.",
        )
        return {"summary": extracted or text[:240], "source_text": text}


class FaultDiagnosisAgent:
    name = "Fault Diagnosis"

    async def run(self, text: str):
        response = await generate(
            f"Diagnose likely root causes and propose a safe diagnostic sequence for: {text}",
            "You are an industrial fault diagnosis assistant. Never claim certainty; rank hypotheses.",
        )
        lower = text.lower()
        hypotheses = []
        if any(word in lower for word in ("noise", "bearing", "vibration")):
            hypotheses.append({"cause": "Bearing wear or misalignment", "confidence": 68})
        if any(word in lower for word in ("heat", "overheat", "hot")):
            hypotheses.append({"cause": "Cooling or lubrication fault", "confidence": 64})
        if any(word in lower for word in ("stop", "stopped", "no power", "tripped")):
            hypotheses.append({"cause": "Power, interlock, or control fault", "confidence": 72})
        if not hypotheses:
            hypotheses.append({"cause": "Insufficient information for a confident diagnosis", "confidence": 35})
        return {"hypotheses": hypotheses, "assessment": response or "Review evidence before selecting a root cause."}


class SparePartsAgent:
    name = "Spare Parts"

    async def run(self, text: str):
        response = await generate(
            f"Identify likely original and substitute spare parts for this maintenance problem: {text}",
            "You discover industrial spare parts. Flag exact dimensions and certifications that must be verified.",
        )
        suggestions = []
        if re.search(r"6205|bearing", text, re.I):
            suggestions.append({"original": "SKF 6205", "substitute": "NSK 6205-2Z", "confidence": 91})
            suggestions.append({"original": "SKF 6205", "substitute": "FAG 6205-2RS", "confidence": 88})
        if re.search(r"abb|drive|vfd", text, re.I):
            suggestions.append({"original": "ABB ACS355 control board", "substitute": "Verify ABB ACS355-compatible board", "confidence": 58})
        if not suggestions:
            suggestions.append({"original": "Part not identified", "substitute": "Consult machine nameplate and parts manual", "confidence": 20})
        return {"suggestions": suggestions, "assessment": response}


class CompatibilityAgent:
    name = "Compatibility Check"

    async def run(self, suggestions: list[dict]):
        return {
            "checks": [
                {
                    "part": suggestion["substitute"],
                    "status": "Requires verification" if suggestion["confidence"] < 80 else "Likely compatible",
                    "confidence": suggestion["confidence"],
                }
                for suggestion in suggestions
            ]
        }


class SafetyReviewAgent:
    name = "Safety Review"

    async def run(self, text: str):
        response = await generate(
            f"Create a safety review checklist for this maintenance task: {text}",
            "You are an industrial safety reviewer. Do not authorize energized work. Use stop-work guidance.",
        )
        return {
            "risk": "High" if re.search(r"electrical|energized|hydraulic|pressure|hot", text, re.I) else "Standard",
            "required_controls": [
                "Lockout/tagout",
                "Verify isolation and stored-energy release",
                "Follow OEM procedure",
                "Obtain qualified-person approval",
            ],
            "assessment": response,
        }


class KnowledgeCurationAgent:
    name = "Knowledge Curation"

    async def run(self, text: str, machine: dict):
        return {
            "draft_title": f"Maintenance observation: {machine.get('name', 'Unknown machine')}",
            "draft_note": text[:500],
            "requires_human_review": True,
        }
