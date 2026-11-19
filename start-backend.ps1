$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "backend")
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "qwen2.5:1.5b"

python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
