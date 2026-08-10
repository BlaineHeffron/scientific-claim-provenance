#!/usr/bin/env python3

import hashlib
import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/claims.json"
MANIFEST = ROOT / "data/export-manifest.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


data = json.loads(DATA.read_text(encoding="utf-8"))
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
assert sha256(DATA) == manifest["claimsJsonSha256"]
assert data["counts"] == {
    "claims": 3,
    "nodes": 105,
    "edges": 119,
    "frontiers": 24,
    "reverseReviewedEdges": 93,
}

for claim in data["claims"]:
    node_ids = [node["id"] for node in claim["nodes"]]
    assert len(node_ids) == len(set(node_ids)) == claim["counts"]["nodes"]
    assert len(claim["edges"]) == claim["counts"]["edges"]
    node_set = set(node_ids)
    for edge in claim["edges"]:
        assert edge["source"] in node_set
        assert edge["target"] in node_set
        assert edge["reviewStatus"] in {"passed", "narrowed"}
    frontiers = [node for node in claim["nodes"] if node["type"] == "unresolved_frontier"]
    assert len(frontiers) == claim["counts"]["frontiers"]

serialized = json.dumps(data, ensure_ascii=False)
for label, pattern in {
    "local path": r"/(?:home|Users|root)/",
    "private PDF path": r"sources/pdfs/",
    "command center": r"\bccq_[A-Za-z0-9_]+\b",
    "message id": r"\bmsg_[A-Za-z0-9_]+\b",
    "session metadata": r"session[_ -]?id",
    "credential": r"sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}",
    "cookie": r"\bcookie\b",
}.items():
    assert not re.search(pattern, serialized, re.I), label

tracked_pdfs = subprocess.run(
    ["git", "ls-files", "--", "*.pdf"], cwd=ROOT, text=True, capture_output=True, check=True
).stdout.strip()
assert not tracked_pdfs
assert not list(ROOT.rglob("*.pdf"))
print("public_export_validation=PASS")
