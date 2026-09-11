#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-18080}"
HOST="${HOST:-0.0.0.0}"
DB_BACKEND="${DB_BACKEND:-sqlite}"
SQLITE_PATH="${SQLITE_PATH:-./data.db}"
PYTHON_BIN="${PYTHON_BIN:-}"

if [ -z "$PYTHON_BIN" ]; then
  for candidate in python3.12 python3.11 python3.10 python3.9 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      break
    fi
  done
fi

if [ -z "$PYTHON_BIN" ]; then
  echo "Python 3.9+ is required, but no python3 command was found." >&2
  exit 1
fi

"$PYTHON_BIN" - <<'PY'
import sys

if sys.version_info < (3, 9):
    raise SystemExit("Python 3.9+ is required. Current: " + sys.version.split()[0])
PY

if [ ! -d ".venv" ]; then
  "$PYTHON_BIN" -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

export APP_HOST="$HOST"
export APP_PORT="$PORT"
export DB_BACKEND="$DB_BACKEND"
export SQLITE_PATH="$SQLITE_PATH"

exec uvicorn app.main:app --host "$HOST" --port "$PORT"
