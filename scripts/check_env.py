from __future__ import annotations

import shutil
import socket
import subprocess


def run(cmd: list[str]) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        text = (p.stdout or p.stderr).strip()
        return p.returncode, text
    except Exception as exc:
        return 1, str(exc)


def which(name: str) -> str:
    return shutil.which(name) or ""


def probe_version(name: str, cmd: list[str]) -> None:
    path = which(name)
    if not path:
        print(f"[FAIL] {name}: not found")
        return
    code, out = run(cmd)
    first = out.splitlines()[0] if out else path
    print(f"[OK]   {name}: {first}" if code == 0 else f"[WARN] {name}: {out}")


def probe_mysql(host: str = "127.0.0.1", port: int = 3306) -> None:
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"[OK]   MySQL service: reachable at {host}:{port}")
    except Exception as exc:
        print(f"[FAIL] MySQL service: {exc}")


if __name__ == "__main__":
    print("== Environment Check ==")
    probe_version("python", ["python", "--version"])
    probe_version("node", ["node", "--version"])
    probe_version("mysql", ["mysql", "--version"])
    probe_mysql()
    print("Decision: use MySQL if reachable; otherwise fall back to SQLite data.db.")

