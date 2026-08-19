import json, pathlib, re
p=pathlib.Path("medicaments.json")
if not p.exists(): raise SystemExit("medicaments.json absent")
d=json.loads(p.read_text(encoding="utf-8"))
assert isinstance(d.get("medicaments"), list)
assert len(d["medicaments"]) >= 1
js=pathlib.Path("app.js").read_text(encoding="utf-8")
assert "function calc()" in js
assert "renderSuggestions" in js
print("Tests locaux OK")
