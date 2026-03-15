# Congressional Polarization Analysis: Data Sources Report

**Date:** 2026-03-15
**Purpose:** Evaluate available datasets for building cosponsorship (and fallback co-voting) networks to measure Congressional polarization over time.

---

## Executive Summary

**Primary Recommendation: VoteView roll-call vote data** as the foundation for co-voting network analysis, supplemented by VoteView member ideology (NOMINATE) scores. This is the most reliable, comprehensive, and immediately downloadable dataset available.

**For cosponsorship networks specifically:** Use the `unitedstates/congress` scraper to pull GPO Bill Status XML (which includes cosponsors), or use the `briatte/congress` R pipeline which produces CSV edge lists. Both require running scripts rather than direct CSV downloads.

**Key finding:** No single source provides a clean, ready-to-download CSV of all cosponsorship records across all Congresses. Cosponsorship data universally requires either API calls, XML parsing, or running R/Python scripts. Roll-call vote data from VoteView, by contrast, is available as direct CSV downloads covering the 1st through 119th Congress.

---

## Source-by-Source Evaluation

### 1. VoteView / UCLA (voteview.com) — RECOMMENDED

**What it provides:**
- Roll-call vote records (every recorded vote, every member, every Congress)
- Member ideology scores (DW-NOMINATE, 1st and 2nd dimension)
- Member metadata (party, state, chamber, ICPSR ID)
- Party-level aggregate data

**Coverage:** 1st Congress (1789) through 119th Congress (2025-2027), updated live as new votes are taken.

**Format:** CSV and JSON, direct download, no authentication required.

**Direct Download URLs:**
| File | URL |
|------|-----|
| Members + NOMINATE scores | `https://voteview.com/static/data/out/members/HSall_members.csv` |
| Individual vote records | `https://voteview.com/static/data/out/votes/HSall_votes.csv` |
| Roll-call metadata | `https://voteview.com/static/data/out/rollcalls/HSall_rollcalls.csv` |
| Party aggregates | `https://voteview.com/static/data/out/parties/HSall_parties.csv` |

**Per-chamber variants** (replace `HS` prefix):
- House only: `H` prefix (e.g., `Hall_members.csv`)
- Senate only: `S` prefix (e.g., `Sall_members.csv`)

**Per-Congress variants** (replace `all` with congress number):
- e.g., `https://voteview.com/static/data/out/votes/HS117_votes.csv`

**Key fields in `HSall_members.csv`:**
- `congress`, `chamber`, `icpsr` (unique member ID), `state_abbrev`, `party_code`
- `nominate_dim1` (liberal-conservative), `nominate_dim2` (social/cultural)
- `bioname`, `bioguide_id`

**Key fields in `HSall_votes.csv`:**
- `congress`, `chamber`, `icpsr`, `rollnumber`, `cast_code`
- Cast codes: 1/2/3 = Yea variants, 4/5/6 = Nay variants, 7/8/9 = abstentions/absent

**Key fields in `HSall_rollcalls.csv`:**
- `congress`, `chamber`, `rollnumber`, `date`, `bill_number`, `vote_result`, `vote_question`
- NOMINATE spatial model parameters

**Accessibility:** Fully free, no API key, no authentication. Direct HTTP download of CSV files. Public domain data.

**Citation:** Lewis, Jeffrey B., Keith Poole, Howard Rosenthal, Adam Boche, Aaron Rudkin, and Luke Sonnet (2026). Voteview: Congressional Roll-Call Votes Database. https://voteview.com/

**Why this is the top recommendation:**
1. Direct CSV download — no scripts, no API keys, no XML parsing
2. Broadest coverage (1st–119th Congress)
3. Includes pre-computed NOMINATE ideology scores for validation
4. Actively maintained and updated live
5. Well-documented with stable URLs
6. Can build co-voting networks directly from the votes file

---

### 2. James Fowler's Cosponsorship Network Data (UC San Diego)

**What it provides:**
- Directed cosponsorship networks (cosponsor → sponsor links)
- Network centrality measures (closeness, betweenness, eigenvector)
- Bill-level and legislator-level cosponsorship statistics

**Coverage:** 93rd–108th Congress (1973–2004). **Not updated since ~2006.**

**Format:** Unclear from public documentation; likely fixed-width text or CSV. Available as downloadable files on Fowler's website.

**URLs:**
- Data page: `http://jhfowler.ucsd.edu/cosponsorship.htm`
- Harvard Dataverse replication: `https://dataverse.harvard.edu/dataset.xhtml?persistentId=hdl:1902.1/10514`
- Alternative Dataverse: `https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/O22JMY`

**Accessibility:** Free download, no authentication. However, the UCSD page may have intermittent availability (academic personal pages). Harvard Dataverse is more reliable.

**Limitations:**
- Coverage ends at the 108th Congress (2004) — 20+ years out of date
- Does not cover the period of greatest polarization acceleration (2010s–2020s)
- Pre-computed network measures may not match our methodology
- Academic website may go offline without notice

**Usefulness for our project:** Limited as a primary source due to age, but valuable as a **validation benchmark** — we can compare our network measures against Fowler's published results for the 93rd–108th Congress.

---

### 3. GovTrack / unitedstates/congress (GitHub)

**What it provides:**
- Scrapers that pull official bill data (including cosponsors) from Congress.gov/GPO
- Outputs structured JSON/XML per bill
- Also scrapes roll-call votes, amendments, committee data

**Coverage:** Bill status data available from the 93rd Congress (1973) to present via GPO bulk data. Vote data from 1789 to present.

**Format:** JSON and XML output files (one per bill). NOT pre-built CSV.

**URLs:**
- GitHub repo: `https://github.com/unitedstates/congress`
- GPO bulk bill status (source data): `https://www.govinfo.gov/bulkdata/BILLSTATUS`

**How to use:**
```bash
pip install .
usc-run govinfo --bulkdata=BILLSTATUS   # fetches bill status XML
usc-run bills                            # processes into JSON
```

**Accessibility:** Free, open source, no API key needed for the bulk data. Requires Python environment and disk space for full scrape.

**Cosponsorship data:** YES — the Bill Status XML from GPO includes `<cosponsors>` elements with bioguide IDs, party, state, and sponsorship dates. However, extracting cosponsorship into a network format requires custom parsing of thousands of XML files.

**Limitations:**
- Requires running Python scraper (not a direct download)
- Produces one JSON/XML file per bill — needs aggregation into a network
- Full scrape of all Congresses takes significant time and disk space
- No pre-built cosponsorship network files

---

### 4. briatte/congress (GitHub) — Best Cosponsorship Network Builder

**What it provides:**
- R scripts that build cosponsorship networks from Congressional data
- Replicates and extends Fowler's methodology
- Outputs CSV edge lists and network visualizations

**Coverage:** 93rd Congress (1973) to present, both chambers.

**Format:** CSV edge lists (one bill per row with sponsor/cosponsor columns). Requires running R scripts to generate.

**URL:** `https://github.com/briatte/congress`

**How to use:**
```r
source("make.r")  # runs full pipeline
# Requires R with network analysis packages
```

**Key script: `01-data.r`** downloads bills from Library of Congress via JSON dumps and legislator data from `unitedstates/congress-legislators`.

**Key script: `02-build.r`** computes weighted network ties using Fowler's weighted propensity to cosponsor methodology.

**Accessibility:** Free, open source. Requires R environment with dependencies.

**Limitations:**
- Must run R scripts (not a direct download)
- Depends on upstream data sources (Congress JSON dumps) that may change
- May require troubleshooting of R package dependencies
- Less well-maintained than VoteView

---

### 5. Congress.gov API (Library of Congress)

**What it provides:**
- Official API access to bills, members, votes, committees, and cosponsors
- Cosponsor endpoint: `https://api.congress.gov/v3/bill/{congress}/{type}/{number}/cosponsors`

**Coverage:** All electronically available records (varies by data type; bills from ~93rd Congress onward).

**Format:** JSON and XML responses.

**URL:** `https://api.congress.gov/`

**Accessibility:** **Requires free API key** (sign up at `https://api.congress.gov/sign-up/`). Rate limit: 5,000 requests/hour.

**Limitations for our project:**
- Requires API key registration
- Rate-limited: building a complete cosponsorship dataset across all Congresses would require tens of thousands of API calls
- No bulk cosponsorship download — must query bill by bill
- Better suited for targeted queries than comprehensive network analysis

---

### 6. GPO Bill Status Bulk Data (govinfo.gov)

**What it provides:**
- Complete bill status records in XML, including cosponsors
- Official government source, same data Congress.gov uses

**Coverage:** 93rd Congress (1973) to present.

**Format:** XML (BILLSTATUS schema). Organized by Congress and bill type.

**URL:** `https://www.govinfo.gov/bulkdata/BILLSTATUS`
- Per-Congress: `https://www.govinfo.gov/bulkdata/BILLSTATUS/{congress}/{billtype}`
- Example: `https://www.govinfo.gov/bulkdata/BILLSTATUS/117/hr`

**Accessibility:** Fully free, no API key, direct download of ZIP archives.

**Cosponsorship fields in XML:**
- `<cosponsors>` → `<item>` elements with `bioguideId`, `fullName`, `party`, `state`, `sponsorshipDate`, `isOriginalCosponsor`, `sponsorshipWithdrawnDate`

**Limitations:**
- XML format requires parsing
- One XML file per bill — thousands of files per Congress
- Need to extract and aggregate into network format
- Large download size for complete dataset

---

### 7. ProPublica Congress API — DEFUNCT

**Status:** Shut down as of July 2024. No new API keys issued.

**What it offered:** Bill data including cosponsors, member data, vote positions.

**Bulk data alternative:** ProPublica still offers bulk bill data downloads at `https://www.propublica.org/datastore/dataset/congressional-data-bulk-legislation-bills` — JSON/XML files for current Congress only.

**Recommendation:** Do not use. Migrate to Congress.gov API or GPO bulk data.

---

### 8. BICAM Dataset (MIT, 2025)

**What it provides:**
- Comprehensive Congressional data across 11 components (bills, amendments, members, committees, etc.)
- PostgreSQL database schema
- Python package for downloading and querying

**Coverage:** All electronically available records (1789–present where available).

**Format:** PostgreSQL database. Python package (`pip install bicam`).

**URLs:**
- Paper: `https://www.nature.com/articles/s41597-025-05737-8`
- GitHub: `https://github.com/bicam-data/bicam-collection`
- Docs: `https://py.docs.bicam.net/en/latest/`

**Accessibility:** Free, but requires API keys for Congress.gov and GovInfo.gov to build the database. The Python package handles the downloading.

**Limitations:**
- Requires setting up API keys and a PostgreSQL database
- Heavy infrastructure for our purposes
- Relatively new (2025) — community support still developing

---

### 9. unitedstates/congress-legislators (Member Metadata)

**What it provides:**
- Comprehensive legislator biographical data (1789–present)
- Party affiliations, terms of service, committee assignments
- Cross-reference IDs (bioguide, ICPSR, GovTrack, OpenSecrets, etc.)

**Format:** YAML (primary), with CSV and JSON on the `gh-pages` branch.

**URLs:**
- GitHub: `https://github.com/unitedstates/congress-legislators`
- CSV downloads (gh-pages branch):
  - `https://theunitedstates.io/congress-legislators/legislators-current.csv`
  - `https://theunitedstates.io/congress-legislators/legislators-historical.csv`

**Accessibility:** Fully free, direct download, no authentication.

**Usefulness:** Essential supplementary data for mapping member IDs across datasets and getting party/state/biographical information.

---

### 10. Congress in Data (congressindata.com)

**What it provides:** Adjacency matrices for alumni connections, committee connections, and cosponsorship networks.

**Coverage:** 109th–113th Congress (2005–2015) only.

**Format:** Adjacency matrices (format unspecified until download).

**Accessibility:** Requires application for research access. Free for non-commercial use but gated.

**Recommendation:** Too narrow in coverage and too restricted in access for our purposes.

---

### 11. Cornell congress-bills Dataset

**What it provides:** Hypergraph/simplicial complex representation of cosponsorship. Derived from Fowler's data.

**Coverage:** 93rd–108th Congress (same as Fowler).

**URL:** `https://www.cs.cornell.edu/~arb/data/congress-bills/`

**Usefulness:** Academic/mathematical interest only. Same coverage limitations as Fowler.

---

## Comparative Summary

| Source | Cosponsorship? | Coverage | Format | Download? | API Key? |
|--------|---------------|----------|--------|-----------|----------|
| **VoteView** | No (votes only) | 1st–119th | CSV | Yes, direct | No |
| **Fowler** | Yes (networks) | 93rd–108th | Text files | Yes | No |
| **briatte/congress** | Yes (edge lists) | 93rd–present | CSV (via R) | Run scripts | No |
| **GPO BILLSTATUS** | Yes (per-bill XML) | 93rd–present | XML | Yes, bulk ZIP | No |
| **Congress.gov API** | Yes (per-bill) | 93rd–present | JSON | API calls | Yes (free) |
| **unitedstates/congress** | Yes (per-bill) | 93rd–present | JSON/XML | Run scripts | No |
| **BICAM** | Yes | 93rd–present | PostgreSQL | Run pipeline | Yes (free) |
| **ProPublica API** | Yes | Was 104th+ | JSON | **DEFUNCT** | N/A |
| **Congress in Data** | Yes (matrices) | 109th–113th | Matrices | Gated | N/A |
| **VoteView Members** | No (ideology) | 1st–119th | CSV | Yes, direct | No |

---

## Recommended Strategy

### Primary Path: Co-Voting Networks from VoteView (Fastest, Most Reliable)

Download these three files immediately:
1. `https://voteview.com/static/data/out/members/HSall_members.csv` — member info + NOMINATE scores
2. `https://voteview.com/static/data/out/votes/HSall_votes.csv` — individual vote records
3. `https://voteview.com/static/data/out/rollcalls/HSall_rollcalls.csv` — vote metadata

**How to build co-voting networks:**
- For each Congress and chamber, create a member-by-member matrix
- Cell (i,j) = number of times members i and j voted the same way
- Normalize by total shared votes to get a similarity score
- Threshold or weight edges to create a network graph
- Compare cross-party vs. within-party edge weights over time

**Advantages:**
- Immediate CSV download, no scripts or API keys
- Coverage from 1789 to present (though roll-call votes are sparse before ~1850)
- NOMINATE scores provide ground-truth ideology comparison
- Well-established methodology (Poole & Rosenthal)

### Secondary Path: Cosponsorship Networks from GPO Bulk Data

If cosponsorship analysis is specifically needed:
1. Download GPO BILLSTATUS ZIP archives per Congress from `https://www.govinfo.gov/bulkdata/BILLSTATUS/{congress}/{type}`
2. Parse XML to extract sponsor/cosponsor pairs with bioguide IDs
3. Build directed network (cosponsor → sponsor)
4. Use `unitedstates/congress-legislators` CSV for member metadata mapping

This requires more engineering but produces true cosponsorship networks.

### Validation: Cross-Reference with NOMINATE

Regardless of which network approach we use, VoteView's NOMINATE scores provide an independent ideology measure for validation. If our network-derived polarization trends match the well-documented NOMINATE divergence, we know our methodology is sound.

---

## Files to Download First

Priority order for immediate download:

```
# VoteView (primary data)
wget https://voteview.com/static/data/out/members/HSall_members.csv
wget https://voteview.com/static/data/out/votes/HSall_votes.csv
wget https://voteview.com/static/data/out/rollcalls/HSall_rollcalls.csv

# Member metadata (supplementary)
wget https://theunitedstates.io/congress-legislators/legislators-current.csv
wget https://theunitedstates.io/congress-legislators/legislators-historical.csv
```

These five files give us everything needed to build co-voting networks with full member metadata from the 1st through 119th Congress.
