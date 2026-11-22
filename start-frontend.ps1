$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
npm install
npm run dev
