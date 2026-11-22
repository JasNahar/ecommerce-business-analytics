$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot
python scripts/generate_ecommerce_data.py
python scripts/validate_data.py
python scripts/load_sqlite.py
