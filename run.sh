#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
command -v uv >/dev/null 2>&1 || { printf '%s
' 'Install uv first: https://docs.astral.sh/uv/getting-started/installation/'; exit 1; }
command -v npm >/dev/null 2>&1 || { printf '%s
' 'Install Node.js and npm first.'; exit 1; }
uv sync --frozen
npm --prefix web ci
npm --prefix web run build
printf '%s
' 'Open http://127.0.0.1:8000 — local ideal Qiskit simulation. Ctrl-C stops the server.'
exec uv run --frozen uvicorn server.app:app --host 127.0.0.1 --port 8000
