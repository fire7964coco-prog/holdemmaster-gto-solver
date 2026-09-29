"""Build a verification-only engine with the exact R1 method beside R1b.

Run from anywhere: python solver/rust/r1b-verify/prepare.py
No production engine file, git index, or baseline snapshot is modified.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
MEASURE = ROOT / "참고자료" / "측정_R1b_2026-09-29"
PRODUCTION = ROOT / "solver" / "rust" / "postflop-solver"
FIXTURE = MEASURE / "verification-engine"
RELATIVE = "rust/postflop-solver/src/game/interpreter.rs"
BASELINE_HEAD = "2845be3"


def method(source: str) -> str:
    start = source.index("    pub fn expected_values_detail(&self, player: usize) -> Vec<f32> {")
    end = source.index("{", start) + 1
    depth = 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[start:end]


baseline = subprocess.check_output(["git", "show", f"{BASELINE_HEAD}:{RELATIVE}"], cwd=ROOT / "solver").decode("utf-8").replace("\r\n", "\n")
current = (PRODUCTION / "src/game/interpreter.rs").read_text(encoding="utf-8")
body = method(baseline)
assert body == method(current), "Legacy method changed"
shutil.copytree(PRODUCTION, FIXTURE, dirs_exist_ok=True, ignore=shutil.ignore_patterns("target", ".git"))
fixture_source = current + "\nimpl PostFlopGame {\n" + body.replace(
    "pub fn expected_values_detail(", "pub fn expected_values_detail_r1_baseline(", 1
) + "\n}\n"
(FIXTURE / "src/game/interpreter.rs").write_text(fixture_source, encoding="utf-8")
(MEASURE / "old-function-source.json").write_text(json.dumps({
    "baseline_head": BASELINE_HEAD,
    "body_equal": True,
    "body_sha256_lf": hashlib.sha256(body.encode()).hexdigest(),
}, indent=2), encoding="utf-8")
print("Verification engine prepared; legacy method body matches R1 exactly.")
