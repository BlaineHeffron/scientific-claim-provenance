# Contributing

The Claim Provenance Atlas is an early working demo: an AI-assisted prototype
whose human validation is still pending. Corrections and challenges are the most
useful contribution right now.

The public site is read-only, but the method is designed for distributed audit.
Until the contribution protocol and disagreement registry are implemented,
please open an
[issue](https://github.com/BlaineHeffron/scientific-claim-provenance/issues)
containing:

- one atomic proposition or dependency edge. For an existing node, give its ID
  (for example `C1-N05`; the explorer shows the ID on every node). For an
  existing edge, give the IDs of the two nodes it connects;
- the exact source manifestation and printed locator;
- the evidence class and proposed sensitivity (verdict-capable, precision only,
  interpretation only, or unknown);
- whether you are challenging a node, edge, frontier, or wording;
- the specific evidence that would resolve disagreement.

Do not upload copyrighted PDFs, institutional downloads, cookies, credentials,
or lengthy source extracts. Agreement counts do not settle a claim; evidence or
an explicit unresolved status does.

## Data and site changes

`data/claims.json` is an export pinned by a SHA-256 hash in
`data/export-manifest.json`. Please propose data changes in an issue instead of
editing the file in a pull request.

For problems with the explorer itself, such as a bug, a broken link, or unclear
wording, open an issue. If you send a pull request, first run the checks in the
[README](README.md#validate).
