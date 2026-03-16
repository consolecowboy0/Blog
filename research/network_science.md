# Network Science Reference: Criminal Network Dismantling

## 1. Network Dismantling Strategies

### Degree-based attack (hub removal)
Remove nodes with the most connections first. Effective because criminal networks tend to have a few highly connected "hubs." Targets visible, powerful actors. In scale-free networks, this causes rapid fragmentation.

### Betweenness-based attack (broker removal)
Remove nodes that sit on the most shortest paths between other nodes -- the brokers and bridges. Generally the *most effective* strategy in criminal networks. Cavallaro et al. (2020) found that neutralizing only 5% of affiliates by betweenness dropped connectivity by 70% in Mafia networks. Betweenness targeting disrupts communication between distant parts of the network and slows recovery more than degree targeting.

### Edge removal
Remove communication links rather than arresting individuals. Less studied in the criminal network literature but relevant when full arrests are not feasible.

### Random failure
Remove nodes at random (simulating uninformed intervention). Highly ineffective against criminal networks. Scale-free topology means most randomly chosen nodes are low-degree and their removal barely affects overall connectivity.

### Comparative effectiveness (literature consensus)
Betweenness > Degree > Closeness > Random. Sequential removal (one at a time, recalculating centrality) outperforms parallel/block removal. However, criminal networks can adapt and may even become more efficient (though less secure) after disruption.

---

## 2. The Project Caviar Dataset

### Background
- Canadian law enforcement investigation (1994-1996) targeting hashish and cocaine importers in Montreal.
- Joint operation: Montreal Police + Royal Canadian Mounted Police + international agencies.
- Led by investigation of Daniel Serero, alleged network leader.
- Network initially imported marijuana from Morocco via Spain; after a seizure, pivoted to cocaine from Colombia via the US.
- 11 drug consignments seized during the investigation; arrests made only at the end.

### The dataset
- 110 participants total: players 1-82 are traffickers, 83-110 are non-traffickers (financiers, accountants, business owners).
- Data source: 4,279 paragraphs (1,000+ pages) of electronically intercepted phone conversations submitted as court evidence.
- 11 one-mode matrices (person x person) representing 11 investigation phases, plus a full 110x110 matrix.
- Ties are directed and valued (communication frequency from wiretaps).
- Rare longitudinal criminal network data -- allows studying network evolution under disruption.

### Key published findings
- **Morselli** (Universite de Montreal): Collected and published the dataset in *Inside Criminal Networks* (Springer). Showed that criminal networks balance efficiency (short paths) against security (sparse connections). Found that out-degree centrality predicted guilty verdicts.
- **Ficara, Cavallaro et al.**: Applied SNA disruption methods to criminal networks including Caviar. Found betweenness centrality is the most effective targeting metric. No significant difference between weighted and unweighted analysis for criminal networks. Published disruption code/data on GitHub (lcucav/criminal-nets).
- **Morselli et al. (2013)**: Eigenvector centrality better predicts harsher sentences than betweenness centrality. Out-degree centrality significantly contributes to verdict classification.

---

## 3. The Albert-Barabasi Result

Scale-free networks (those with power-law degree distributions and a few highly connected hubs) are robust to random node failures because most randomly selected nodes have low degree and their removal has negligible effect on connectivity. However, they are extremely fragile to targeted attacks on high-degree hubs, which rapidly fragment the network. This "robust yet fragile" property was established by Albert, Jeong, and Barabasi in their 2000 *Nature* paper "Error and attack tolerance of complex networks."

---

## 4. Expected Results for Caviar Network Experiments

Based on the literature, we should expect:

| Strategy | Expected Effect | Why |
|----------|----------------|-----|
| **Degree targeting** | Effective. Rapid increase in fragmentation; network breaks into disconnected components after removing a small fraction of top-degree nodes. | Caviar has hub-like structure; removing hubs isolates peripheral members. |
| **Betweenness targeting** | Most effective. Likely fragments the network faster than degree targeting, especially in early removals. | Brokers connect sub-groups; their removal severs communication paths between clusters. |
| **Random removal** | Ineffective. Network remains largely connected even after removing a substantial fraction of nodes. | Most nodes are low-degree; random removal is unlikely to hit critical hubs or brokers. |

### Specific quantitative expectations
- Betweenness targeting should reduce the largest connected component (LCC) dramatically with removal of ~5-10% of nodes.
- Degree targeting should show similar but slightly less dramatic curves.
- Random removal curves should be nearly flat until a large fraction (>50%) of nodes are removed.
- The gap between targeted and random removal demonstrates the "robust yet fragile" property in a real-world criminal network.
- Recalculating centrality after each removal (adaptive/sequential) should outperform static ranking.

---

## Key References

- Albert, R., Jeong, H. & Barabasi, A.-L. "Error and attack tolerance of complex networks." *Nature* 406, 378-382 (2000).
- Morselli, C. *Inside Criminal Networks.* Springer (2009).
- Cavallaro, L., Ficara, A., De Meo, P., Fiumara, G., Catanese, S., Bagdasar, O., & Liotta, A. "Disrupting resilient criminal networks through data analysis: The case of Sicilian Mafia." *PLoS ONE* 15(8): e0236476 (2020).
- Ficara, A., Cavallaro, L., et al. "Social Network Analysis of Sicilian Mafia Interconnections." (2021).
- Duijn, P.A.C., Kashirin, V. & Sloot, P.M.A. "The relative ineffectiveness of criminal network disruption." *Scientific Reports* 4, 4238 (2014).
- Morselli, C. & Boivin, R. "Modeling Verdict Outcomes Using Social Network Measures: The Watergate and Caviar Network Cases." *PLoS ONE* 11(1): e0147248 (2016).
