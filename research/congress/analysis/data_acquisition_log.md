# Data Acquisition Log

**Date:** 2026-03-15
**Agent:** Data Acquisition Agent (Agent 7)
**Project:** Bipartisan Cooperation Networks in U.S. Congress

---

## Summary

This log documents the data acquisition process for building bipartisan cooperation networks. The primary data source is VoteView's roll-call voting data; cosponsorship data is secondary.

### Environment Limitation

The sandbox environment blocks outbound HTTP to most domains (voteview.com, dataverse.harvard.edu, theunitedstates.io, etc.) via a proxy firewall. Only GitHub (github.com, raw.githubusercontent.com) is accessible. As a result, VoteView CSV files could not be downloaded directly. Download scripts have been created for execution outside the sandbox.

---

## Data Successfully Downloaded

### 1. Legislators Data (from @unitedstates/congress-legislators on GitHub)

| File | Size | Records | Source |
|------|------|---------|--------|
| `data/legislators/legislators-current.yaml` | 1.1 MB | 538 current members | GitHub |
| `data/legislators/legislators-historical.yaml` | 8.6 MB | 12,225 historical members | GitHub |
| `data/legislators/legislators-current.json` | 1.5 MB | 538 (converted from YAML) | Local |
| `data/legislators/legislators-historical.json` | 13 MB | 12,225 (converted from YAML) | Local |
| `data/legislators/executive.yaml` | 30 KB | Presidents/VPs | GitHub |

**Contents:** Comprehensive legislator records including:
- `bioguide_id`, `icpsr`, `govtrack`, `opensecrets` IDs (for cross-referencing with VoteView)
- Name, birth/death dates, gender
- Full term history (chamber, state, party, district, start/end dates)

### 2. Pre-existing Processed Data (from prior agents)

These files were already present in the data directory:

| File/Directory | Size | Description |
|---------------|------|-------------|
| `data/nominate/members_all.csv` | 559 KB | 13,871 member-congress records (93rd-118th), synthetic IDs |
| `data/cosponsorship/all_cross_party_edges.csv` | 3.7 MB | 66,811 cross-party edges (93rd-118th) |
| `data/graphs/house_*_edges.csv` | 81-240 KB each | 26 House edge files (93rd-118th) |
| `data/rollcall/party_line_votes.csv` | 589 B | Party-line vote percentages by Congress |
| `data/nominate/nominate_overlap.csv` | 1.8 KB | NOMINATE score overlap data |

**Note:** The pre-existing `members_all.csv` uses synthetic sequential member IDs (1, 2, 3...) rather than real ICPSR identifiers. This limits cross-referencing with actual VoteView data. The `data/nominate/HSall_members.csv` is a 14-byte 404 error page, not actual data.

---

## Data NOT Downloaded (Blocked by Proxy)

### VoteView Roll-Call Data (PRIMARY SOURCE)

These files need to be downloaded outside the sandbox using the provided scripts:

| File | URL | Est. Size | Description |
|------|-----|-----------|-------------|
| HSall_members.csv | `https://voteview.com/static/data/out/members/HSall_members.csv` | ~50 MB | All members, all Congresses |
| HSall_rollcalls.csv | `https://voteview.com/static/data/out/rollcalls/HSall_rollcalls.csv` | ~30 MB | All roll-call vote metadata |
| HSall_votes.csv | `https://voteview.com/static/data/out/votes/HSall_votes.csv` | ~1-2 GB | Individual vote records |

**HSall_members.csv columns:** congress, chamber, icpsr, state_icpsr, district_fips, state_abbrev, party_code, occupancy, last_means, bioname, bioguide_id, born, died, nominate_dim1, nominate_dim2, nominate_log_likelihood, nominate_geo_mean_probability, nominate_number_of_votes, nominate_number_of_errors, conditional

**HSall_votes.csv columns:** congress, chamber, rollnumber, icpsr, cast_code, prob

**Cast codes:** 0=Not member, 1=Yea, 2=Paired Yea, 3=Announced Yea, 4=Announced Nay, 5=Paired Nay, 6=Nay, 7=Present, 8=Present, 9=Not Voting

**Per-Congress alternative:** If HSall_votes.csv is too large (>500MB), individual files are available:
- `https://voteview.com/static/data/out/votes/H093_votes.csv` (House, 93rd Congress)
- `https://voteview.com/static/data/out/votes/S093_votes.csv` (Senate, 93rd Congress)

### Cosponsorship Data (SECONDARY)

- **Fowler's data** (https://fowler.ucsd.edu/cosponsorship.htm): Pre-built cosponsorship networks for 93rd-110th Congress
- **@unitedstates/congress** (https://github.com/unitedstates/congress): Scripts to download bill data including cosponsors from Congress.gov

---

## Download Scripts Created

| Script | Purpose |
|--------|---------|
| `scripts/download_voteview.sh` | Bash script to download all VoteView CSV files |
| `scripts/download_voteview.py` | Python script with size-checking, per-congress fallback, verification |
| `scripts/download_cosponsorship.py` | Python script for Fowler's data and @unitedstates/congress setup |

### Usage

```bash
# Download VoteView data (run outside sandbox)
cd /home/user/Blog/research/congress
bash scripts/download_voteview.sh

# Or with Python (supports --congresses, --force flags)
python3 scripts/download_voteview.py --congresses 93-118

# Cosponsorship data (optional, secondary source)
python3 scripts/download_cosponsorship.py --method fowler
```

---

## Recommendations for Next Steps

1. **Run `download_voteview.py`** outside the sandbox to get the real VoteView CSV data with actual ICPSR identifiers
2. **Cross-reference** VoteView ICPSR IDs with the legislators YAML data (which has bioguide, ICPSR, and other IDs) to get full member names, states, and party information
3. **For co-voting networks:** Use HSall_votes.csv to compute pairwise agreement rates between members (cast_code 1-3 = Yea, cast_code 4-6 = Nay)
4. **The pre-existing data** (members_all.csv, edge files) can be used as-is for initial analysis, but real VoteView data will be needed for publication-quality work

---

## Data Sources Reference

- **VoteView:** Lewis, Jeffrey B., Keith Poole, Howard Rosenthal, Adam Boche, Aaron Rudkin, and Luke Sonnet (2026). Voteview: Congressional Roll-Call Votes Database. https://voteview.com/
- **@unitedstates/congress-legislators:** https://github.com/unitedstates/congress-legislators
- **@unitedstates/congress:** https://github.com/unitedstates/congress
- **Fowler Cosponsorship Data:** https://fowler.ucsd.edu/cosponsorship.htm
