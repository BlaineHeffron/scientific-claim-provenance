# Claim Provenance Atlas

A read-only explorer for the evidence, assumptions, calibrations, and unresolved
frontiers beneath three audited scientific claims.

Live site: <https://blaineheffron.github.io/scientific-claim-provenance/>

The current dataset contains 105 dependency nodes and 119 reviewed edges from a
bounded historical-audit pilot. It includes derived propositions and source
locators only. Source PDFs, institutional downloads, credentials, and private
collaboration transcripts are neither tracked nor published.

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Validate

```bash
python3 tests/validate_public_export.py
python3 tests/validate_site.py
node --check app.js
```

## Epistemic status

This is an AI-assisted methods prototype, not expert consensus or a model-vote
credibility score. The graphs are bounded at two dependency layers with explicit
exceptions and frontiers. Every accepted non-frontier edge in the source audit
received reverse review, but qualified human validation remains pending.

Code is MIT licensed. Derived graph metadata is made available under CC BY 4.0;
the cited source works retain their own rights.
