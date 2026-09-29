"""Capture the verifier's native exit code and stdout/stderr without PS5 rewriting."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
measure = root / "참고자료" / "측정_R1b_2026-09-29"
output = measure / "btn-v2"
flop = sys.argv[1]
assert flop in {"Ah7d2c", "Ad7c2c", "Ac7c2c"}
start = time.perf_counter()
with (measure / f"btn-{flop}.log").open("wb") as log:
    run = subprocess.run(
        ["C:/Temp/wpf-target/release/r1b-verify.exe", flop, str(output)],
        cwd=root,
        env=dict(os.environ, RAYON_NUM_THREADS="12"),
        stdout=log,
        stderr=subprocess.STDOUT,
    )
result = {"flop": flop, "native_exit_code": run.returncode, "wall_seconds": time.perf_counter() - start}
(measure / f"btn-{flop}-process.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result))
raise SystemExit(run.returncode)
