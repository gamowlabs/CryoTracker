"""Build test pages that run index.html against an in-memory fake of the Claude
artifact runtime (db, user, downloads), seeded from data/sample-boxes.json.
Usage: python3 tests/build_harness.py   -> writes tests/out/test.html and test_ro.html"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "tests" / "out"; out.mkdir(exist_ok=True)
page = (root / "index.html").read_text()
mock = (root / "tests" / "mock-claude.js").read_text()
seed = json.loads((root / "data" / "sample-boxes.json").read_text())["boxes"]
skel = ('<!doctype html><html><head><meta charset=utf-8><meta name=viewport '
        'content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}'
        '[hidden]{display:none!important}</style></head><body>')
def build(name, can):
    pre = f"<script>window.__CAN={str(can).lower()};window.__SEED={json.dumps(seed)};</script><script>{mock}</script>"
    (out / name).write_text(skel + pre + page + "</body></html>")
build("test.html", True); build("test_ro.html", False)
print("wrote", out)
