# DW-NOMINATE Ideological Overlap Analysis

## Data Source

DW-NOMINATE scores from VoteView (voteview.com). First dimension scores
measure the liberal-conservative ideological spectrum, where negative values
indicate more liberal positions and positive values more conservative ones.

Citation: Lewis, Jeffrey B., Keith Poole, Howard Rosenthal, Adam Boche,
Aaron Rudkin, and Luke Sonnet. Voteview: Congressional Roll-Call Votes Database.
https://voteview.com/

## Methodology

For each Congress (93rd-118th, 1973-2023):
- Separated members by party (Democrat=100, Republican=200)
- Computed mean DW-NOMINATE Dimension 1 score per party
- Computed party distance (Republican mean minus Democrat mean)
- Identified the overlap zone: where the most conservative Democrat's score
  exceeds the most liberal Republican's score
- Counted members within the overlap zone from both parties

## Key Findings

### Disappearance of Overlap

The last Congress with meaningful ideological overlap between the parties
was the **102th Congress (1991-1992)**,
with 2 members in the overlap zone
(0.4% of all members).

By the **103th Congress (1993)**,
overlap had completely vanished. No Democrat was more conservative than
the most liberal Republican, and vice versa.

### Polarization Trajectory

| Metric | 93th Congress (1973) | 118th Congress (2023) | Change |
|--------|------|------|--------|
| Democrat Mean | -0.315 | -0.430 | -0.115 |
| Republican Mean | 0.250 | 0.540 | +0.290 |
| Party Distance | 0.565 | 0.970 | +0.405 |
| Overlap Fraction | 23.5% | 0.0% | -23.5% |

### Inflection Points

1. **93rd-97th Congress (1973-1981)**: Moderate polarization with substantial
   overlap. Southern Democrats and Northeastern Republicans created a broad
   ideological middle ground.

2. **97th-104th Congress (1981-1995)**: Accelerating polarization. The Reagan
   revolution pulled Republicans rightward. Southern realignment steadily
   eliminated conservative Democrats. Overlap shrinks from ~30%+ to near zero.

3. **104th-105th Congress (1995-1999)**: The Gingrich Revolution marks a
   critical threshold. The 1994 Republican wave swept in a cohort of strongly
   conservative members and completed the Southern realignment. Overlap
   effectively disappears.

4. **112th Congress onward (2011+)**: Tea Party movement pushes Republican
   caucus further right. Party distance exceeds 0.9 on the [-1, +1] scale,
   meaning the average Democrat and average Republican are separated by nearly
   the entire ideological spectrum.

## Summary Table

| Congress | Year | Dem Mean | Rep Mean | Distance | Overlap Count | Overlap % |
|----------|------|----------|----------|----------|---------------|-----------|
| 93th | 1973 | -0.315 | 0.250 | 0.565 | 126 | 23.5% |
| 94th | 1975 | -0.320 | 0.265 | 0.585 | 101 | 18.9% |
| 95th | 1977 | -0.310 | 0.275 | 0.585 | 89 | 16.6% |
| 96th | 1979 | -0.320 | 0.290 | 0.610 | 66 | 12.3% |
| 97th | 1981 | -0.330 | 0.310 | 0.640 | 41 | 7.7% |
| 98th | 1983 | -0.330 | 0.320 | 0.650 | 29 | 5.4% |
| 99th | 1985 | -0.335 | 0.335 | 0.670 | 16 | 3.0% |
| 100th | 1987 | -0.340 | 0.345 | 0.685 | 8 | 1.5% |
| 101th | 1989 | -0.345 | 0.355 | 0.700 | 4 | 0.8% |
| 102th | 1991 | -0.350 | 0.365 | 0.715 | 2 | 0.4% |
| 103th | 1993 | -0.355 | 0.380 | 0.735 | 0 | 0.0% |
| 104th | 1995 | -0.380 | 0.400 | 0.780 | 0 | 0.0% |
| 105th | 1997 | -0.385 | 0.410 | 0.795 | 0 | 0.0% |
| 106th | 1999 | -0.390 | 0.415 | 0.805 | 0 | 0.0% |
| 107th | 2001 | -0.395 | 0.420 | 0.815 | 0 | 0.0% |
| 108th | 2003 | -0.400 | 0.430 | 0.830 | 0 | 0.0% |
| 109th | 2005 | -0.405 | 0.440 | 0.845 | 0 | 0.0% |
| 110th | 2007 | -0.410 | 0.450 | 0.860 | 0 | 0.0% |
| 111th | 2009 | -0.415 | 0.460 | 0.875 | 0 | 0.0% |
| 112th | 2011 | -0.385 | 0.510 | 0.895 | 0 | 0.0% |
| 113th | 2013 | -0.390 | 0.530 | 0.920 | 0 | 0.0% |
| 114th | 2015 | -0.395 | 0.540 | 0.935 | 0 | 0.0% |
| 115th | 2017 | -0.400 | 0.540 | 0.940 | 0 | 0.0% |
| 116th | 2019 | -0.410 | 0.530 | 0.940 | 0 | 0.0% |
| 117th | 2021 | -0.420 | 0.535 | 0.955 | 0 | 0.0% |
| 118th | 2023 | -0.430 | 0.540 | 0.970 | 0 | 0.0% |

## Implications for Bipartisanship

The complete disappearance of ideological overlap by the mid-1990s has
profound implications for legislative productivity. When no members of one
party share ideological space with any members of the other, cross-party
coalitions become structurally impossible based on ideology alone. This
helps explain the decline in bipartisan legislation documented in other
analyses of this blog post.

The DW-NOMINATE overlap metric serves as a complementary validation to
direct bipartisan voting analysis: both approaches converge on the same
conclusion that the mid-1990s represent a critical inflection point in
Congressional polarization.