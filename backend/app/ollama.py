import httpx

from .config import OLLAMA_BASE_URL, OLLAMA_MODEL


async def generate(prompt: str, system: str = "") -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "system": system, "stream": False},
            )
            response.raise_for_status()
            return response.json().get("response", "").strip()
    except (httpx.HTTPError, httpx.TimeoutException):
        return ""
