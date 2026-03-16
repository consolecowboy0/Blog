# Data Acquisition Log: Project Caviar Network

## Dataset Overview

**Project Caviar** was a Canadian law enforcement investigation (1994-1996) targeting a network of hashish and cocaine importers operating out of Montreal. The investigation was a joint effort by the Montreal Police, the Royal Canadian Mounted Police (RCMP), and international agencies from England, Spain, Italy, Brazil, Paraguay, and Colombia.

The network data is derived from 4,279 paragraphs of court evidence (over 1,000 pages) documenting electronically intercepted telephone conversations between network participants across 11 wiretap warrant phases.

## Acquisition Attempts

### Source 1: UCINET Datasets Page
- **URL**: https://sites.google.com/site/ucinetsoftware/datasets/covert-networks/caviar
- **Result**: HTTP 403 Forbidden. The Google Sites page blocked automated access.
- **Status**: FAILED

### Source 2: GitHub Repositories
- **Search**: Searched GitHub for "caviar network dataset", "caviar drug network"
- **Found**: Two relevant repositories:
  - `AbhilashRN/Project-Caviar-Analysis` - Contains `CAVIAR_FULL.csv` (adjacency matrix)
  - `cvmohan-ds/caviar_network_analysis` - Contains analysis notebook but no raw data files
- **Result**: Successfully downloaded `CAVIAR_FULL.csv` from `AbhilashRN/Project-Caviar-Analysis` (master branch)
- **Status**: SUCCESS

### Source 3: Kaggle
- **URL**: https://www.kaggle.com/datasets/chiragtagadiya/caviar
- **Result**: Identified but not needed (GitHub source succeeded first). HTTP 403 on direct fetch.

### Source 4: R Packages
- **Identified**: `onadata` and `networkdata` R packages contain Caviar data
- **Result**: Not needed (GitHub source succeeded).

## Data Processing

The raw data (`CAVIAR_FULL.csv`) was a 110x110 adjacency matrix where:
- Row and column headers are node IDs (1-110, non-sequential)
- Nodes 1-82 represent drug traffickers
- Nodes 83-110 represent non-traffickers (financial investors, accountants, business owners)
- Cell values represent communication frequency (phone call counts)
- The matrix is **asymmetric** (386 asymmetric cell pairs), confirming directed relationships

### Conversion Steps
1. Downloaded adjacency matrix from GitHub raw URL
2. Parsed the 110x110 matrix, extracting node IDs from headers
3. Converted non-zero cells to directed edges with format: `source, target, weight`
4. Saved as `/home/user/Blog/data/caviar_edges.csv`

## Final Dataset Statistics

| Metric | Value |
|---|---|
| Nodes | 110 |
| Directed edges | 295 |
| Network density | 0.0246 |
| Weakly connected components | 1 |
| Weight range | 1-337 |
| Average in-degree | 2.68 |
| Max in-degree | 37 |
| Max out-degree | 54 |
| Data type | Real (not synthetic) |

## Output File

- **Path**: `/home/user/Blog/data/caviar_edges.csv`
- **Format**: CSV with columns `source`, `target`, `weight`
- **Rows**: 295 (one per directed edge)
- **NetworkX compatible**: Loads directly via `nx.read_edgelist()` or csv DictReader

## Data Provenance

- **Original source**: Court evidence from Project Caviar trials (Montreal, 1994-1996)
- **Academic reference**: Morselli, C. (2009). *Inside Criminal Networks*. Springer.
- **Downloaded from**: https://github.com/AbhilashRN/Project-Caviar-Analysis
- **Acquisition date**: 2026-03-15
- **Synthetic**: No - this is the real dataset
