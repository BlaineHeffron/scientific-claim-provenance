#!/usr/bin/env python3

from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
        self.styles = []
        self.lang = None
        self.buttons = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "html":
            self.lang = values.get("lang")
        if values.get("id"):
            assert values["id"] not in self.ids, f"duplicate id {values['id']}"
            self.ids.add(values["id"])
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.styles.append(values.get("href"))
        if tag == "button":
            self.buttons += 1


parser = SiteParser()
parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
assert parser.lang == "en"
for required in {
    "explorer", "claim-tabs", "graph-stage", "graph-columns", "inspector",
    "survival-text", "shared-grid", "method",
}:
    assert required in parser.ids, required
assert parser.scripts == ["app.js"]
assert parser.styles == ["styles.css"]
assert parser.buttons >= 2
for relative in [*parser.scripts, *parser.styles, "data/claims.json", "data/export-manifest.json"]:
    assert (ROOT / relative).is_file(), relative

js = (ROOT / "app.js").read_text(encoding="utf-8")
assert "innerHTML" not in js
assert "fetch(\"data/claims.json\")" in js
assert "dependency → dependent claim" in (ROOT / "data/claims.json").read_text(encoding="utf-8")
print("site_structure_validation=PASS")
