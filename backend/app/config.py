import os


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./machinememory.db")
