# Fact-Check and Rigor Review

## Simulation Results Accuracy

- **Detective threshold (4 removals)**: Verified. Sequential betweenness targeting reduces LCC below 50% at removal 4.
- **Bruiser threshold (5 removals)**: Verified. Sequential degree targeting crosses 50% at removal 5.
- **Random threshold (37 removals)**: Verified. Averaged over 100 runs.
- **Ghost performance (74% at 55 removals)**: Verified. Edge removal is far less effective than node removal.
- All metrics computed with recalculation after each removal (adaptive/sequential).

## Strategy Descriptions

- Betweenness centrality description (bridges, brokers, shortest paths): Correct.
- Degree centrality description (most connected nodes): Correct.
- Edge betweenness description: Correct.
- Random removal as control: Correct.

## Dataset Description

- "110 members of a drug trafficking ring": Correct (nodes 1-82 traffickers, 83-110 non-traffickers).
- "Mapped from wiretaps during a two-year investigation": Correct (Project Caviar, 1994-1996).
- "Set in Richmond as narrative device": Article is transparent about this transposition.
- Real dataset from published research: Correct (Morselli 2009, Ficara/Cavallaro et al.).

## Concept Accuracy

- Scale-free robustness to random failure: Correctly implied by Random's poor performance.
- Betweenness > degree for network dismantling: Consistent with literature (Cavallaro et al. 2020).
- "Bridge" metaphor for betweenness: Correct simplification.

## Overclaiming Check

- Article does not claim the network is from Richmond: PASS
- Article does not claim real-world predictions: PASS (it's a simulation/model)
- Archetypes described as metaphors mapped to math: PASS

## Word Count

- 1,312 words (under 2,000 limit): PASS

## Style Compliance

- No em dashes: PASS
- Kid appears 3+ times: PASS (opening, middle x2, closing x3)
- Hyphens as casual dashes: PASS
