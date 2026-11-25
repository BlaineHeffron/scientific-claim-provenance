# Claim Provenance Atlas

An early working demo of an evidence map for scientific claims. For each claim
it shows the observations, calibrations, statistical steps, models, and
assumptions the claim depends on, and marks the exact points where the evidence
stops.

**Live demo:** <https://blaineheffron.github.io/scientific-claim-provenance/>

> **Status:** AI-assisted prototype; human validation is pending. The graphs are
> not expert consensus, peer review, or a credibility score. See
> [Validation status](#validation-status).

## What it is

A static, read-only explorer (`index.html`, `app.js`, `styles.css`) over a
single data file, `data/claims.json`. There is no build step and no backend.

The dataset is a bounded historical-audit pilot of three physics claims:

| Claim | Source | Nodes | Edges | Frontiers |
| --- | --- | ---: | ---: | ---: |
| Thermal radiation | H. Rubens and F. Kurlbaum, *Annalen der Physik* 309, 649–666 (1901) | 38 | 41 | 8 |
| Photon anticorrelation | P. Grangier, G. Roger, and A. Aspect, *Europhysics Letters* 1, 173–179 (1986) | 33 | 38 | 8 |
| Gravity-related collapse | S. Donadi et al., *Nature Physics* 17, 74–78 (2021) | 34 | 40 | 8 |
| **Total** | | **105** | **119** | **24** |

In total: 105 nodes, 119 reviewed edges, and 24 frontiers.

- A **node** is one proposition the claim depends on, such as an observation, a
  calibration, or a model assumption. Every non-frontier node carries a locator
  for where the source supports it.
- An **edge** is a dependency between two nodes. Arrows point from a dependency
  to the claim that depends on it. All 119 edges are recorded with a `passed`
  review status. The 93 edges that do not start at a frontier also received
  reverse review; the site shows that figure as "Reverse-reviewed edges".
- A **frontier** is a node where the audit stopped: missing raw data, an
  inaccessible source, or a depth limit. Frontiers are shown, not hidden.

## Try it

Open the [live demo](https://blaineheffron.github.io/scientific-claim-provenance/).
Choose one of the three claims, then select any node to see its proposition, its
source locators, and its immediate edges. Use the filters to narrow by
sensitivity or node type, or select **Frontiers only** to see where the evidence
stops.

### Run locally

You need only Python 3; any static file server works.

```bash
git clone https://github.com/BlaineHeffron/scientific-claim-provenance.git
cd scientific-claim-provenance
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Opening `index.html` directly from disk does
not work, because browsers block the page's request for `data/claims.json` from
a `file://` URL.

## What is in `data/`

| File | Contents |
| --- | --- |
| `claims.json` | The full dataset: the three claims with their nodes, edges, and frontier and sensitivity summaries, plus three shared-dependency records. |
| `export-manifest.json` | SHA-256 hashes of `claims.json` and of the source audit graph it was exported from (that graph is not in this repository), plus the export scan results (no PDF payloads, no local paths). |

The data holds derived propositions and source locators only. Source PDFs,
institutional downloads, credentials, and private collaboration transcripts are
neither tracked nor published.

There is no extraction pipeline in this repository. It holds the exported graphs
and the explorer, not the tooling that produced them.

## Validate

```bash
python3 tests/validate_public_export.py
python3 tests/validate_site.py
node --check app.js
```

The two Python validators use only the standard library. Run them from a git
checkout, because the first one calls `git`. On success they print
`public_export_validation=PASS` and `site_structure_validation=PASS`. The
`node` check is optional and prints nothing on success.

- `validate_public_export.py` checks that `claims.json` matches the SHA-256 in
  the manifest, that the counts match the totals above, that every edge connects
  existing nodes and has a review status, and that the export contains no local
  paths, credentials, or PDFs.
- `validate_site.py` checks the structure of `index.html` and that the files it
  loads exist.

Any edit to `claims.json` changes its hash and fails the first validator.

## Validation status

- **AI-assisted.** This is a methods prototype built with AI assistance. It is
  not expert consensus, peer review, or a model-vote credibility score.
- **Bounded.** The graphs stop at two dependency layers, with explicit
  exceptions and frontiers.
- **Reverse-reviewed in part.** Every accepted non-frontier edge in the source
  audit received reverse review (93 of the 119 edges).
- **Not yet validated by humans.** Qualified human validation is pending.

## Feedback and contributing

Corrections and challenges to any node, edge, or frontier are welcome. Open an
[issue](https://github.com/BlaineHeffron/scientific-claim-provenance/issues);
[CONTRIBUTING.md](CONTRIBUTING.md) lists what to include.

## License and citation

- Code: MIT. See [LICENSE](LICENSE).
- Data (`data/claims.json` and `data/export-manifest.json`): CC BY 4.0. See
  [DATA-LICENSE.md](DATA-LICENSE.md).
- The cited source works retain their own rights.

To cite the project, use [CITATION.cff](CITATION.cff) (the "Cite this
repository" button on GitHub), and cite the underlying primary sources.
