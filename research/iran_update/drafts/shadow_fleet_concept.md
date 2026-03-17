# Shadow Fleet Piece: What It Would Look Like

## The Concept

The hero post asked: "How do you dismantle a criminal network?" and answered it by simulating attack strategies on a real drug trafficking network. This piece asks the same question about a *live, active* sanctions evasion network - Iran's shadow fleet.

The core insight: the US Treasury (OFAC) is running a real-world network dismantling campaign. Every sanctions designation is a node or edge removal. We can measure whether it's working the same way we measured hub removal vs. broker removal vs. random removal on the Caviar network.

---

## The Network

### Nodes (3 types)

1. **Vessels** (~200-300 identifiable shadow fleet tankers)
   - Attributes: IMO number, flag state, deadweight tonnage, build year, AIS dark-time percentage, sanctions status, designation date
   - Source: OFAC SDN list (downloadable XML/CSV), cross-referenced with UANI tanker tracker

2. **Companies** (owners, operators, insurers, flag registries)
   - Attributes: Jurisdiction, type (ship manager / beneficial owner / insurer / flag state), sanctions status
   - Source: OFAC SDN list ownership chains, Windward published reports

3. **Ports / Anchorages** (loading zones, STS transfer points, discharge terminals)
   - Attributes: Country, type (Iranian export terminal / STS zone / Chinese discharge port), volume estimates
   - Source: Kpler published data, CSIS analysis

### Edges (4 types)

1. **Ownership/management** - vessel → company
2. **Insurance/flagging** - vessel → insurer/flag registry
3. **Ship-to-ship transfer** - vessel → vessel (with timestamp, location)
4. **Port call** - vessel → port/anchorage

### What makes this interesting vs. a static criminal network

The Caviar dataset was fixed - a historical snapshot. This network is *dynamic*:
- Vessels get sanctioned and (theoretically) leave the network
- But they can reflag, change ownership, or just keep operating
- New vessels enter to replace sanctioned ones
- The October 2025 AIS event shows the whole fleet responding to external pressure simultaneously

---

## The Analysis

### Phase 1: Build the network from OFAC data

The OFAC SDN list is structured data. Each sanctions designation includes:
- Entity name
- Aliases
- Vessel details (IMO, flag, tonnage)
- Linked entities (owners, operators, managers)
- Designation date

This gives us a bipartite network (vessels ↔ companies) with timestamps. We can reconstruct the network at any point in time by filtering on designation dates.

**Key metric: How many distinct ownership clusters exist?**
- If the shadow fleet is operated by a few key intermediaries (high-betweenness brokers), targeted sanctions should fragment it
- If it's a flat, distributed network with many independent operators, sanctions will be whack-a-mole

### Phase 2: Measure dismantling effectiveness

For each OFAC sanctions tranche (there were several major ones in 2025-2026):
1. Remove the designated nodes from the network
2. Measure: largest connected component size, number of components, average path length
3. Compare against what *would* happen with optimal betweenness targeting vs. degree targeting vs. random removal

**The question:** Is OFAC targeting the right nodes? Are they going after the brokers (betweenness) or the hubs (degree) or neither?

This directly mirrors the hero post's analysis but on a real, ongoing campaign.

### Phase 3: Measure network adaptation

After each sanctions tranche:
- Do sanctioned vessels actually disappear from AIS data?
- Do they reflag and reappear? (Cameroon saw 20+ reflaggings in 30 days in late 2025)
- Do new vessels enter to replace them?
- Does the network topology change (more distributed? more hub-dependent?)

**Key finding to look for:** The "hydra effect" - does cutting heads grow new ones? Criminal network literature (Duijn et al. 2014, already cited in the hero post) found that disruption can actually make criminal networks *more efficient* even as it makes them less secure.

### Phase 4: The October 2025 Anomaly

52 of 88 Iran-flagged tankers simultaneously turned AIS transponders on for 3 days. This is a measurable, fleet-wide behavioral shift. It happened because reimposed UN sanctions made Chinese ports and insurers demand compliance.

This is the most interesting single data point because it shows:
- The network responding to *regulatory pressure* rather than direct enforcement
- The power of downstream chokepoints (Chinese ports, insurers) vs. direct targeting
- A brief window where the "dark" fleet became visible

**Analysis:** During those 3 days, what did the AIS data reveal about fleet structure? How many vessels were in Iranian waters? How many were at STS transfer points? This 3-day window is like briefly turning the lights on in a dark room.

---

## Visualizations

### 1. The Network Graph (hero image)
Bipartite network of vessels and companies, colored by sanctions status. Sanctioned nodes in red, unsanctioned in gray. Size by degree. Should show whether there are clear broker nodes connecting multiple vessels to the broader network.

### 2. Dismantling Curves (direct parallel to hero post)
X-axis: fraction of nodes removed. Y-axis: largest connected component size.
Three curves: OFAC's actual targeting strategy vs. optimal betweenness vs. random.
Shows whether OFAC is doing better or worse than optimal.

### 3. Timeline: Sanctions Tranches vs. Fleet Size
X-axis: time (2024-2026). Y-axis: number of active shadow fleet vessels.
Vertical lines at each major sanctions tranche. Does fleet size actually decline after sanctions?

### 4. Flag State Migration (Sankey diagram)
Show vessels moving between flag states after sanctions. Iran → Panama → Cameroon → ???
Visualizes the reflagging evasion strategy.

### 5. The October 2025 AIS Event
Before/after comparison. Map showing vessel positions during the 3-day window vs. typical dark periods. Heat map of AIS transmission frequency across the fleet.

### 6. Hormuz Strait: Who's Left?
After Feb 28 strikes, legitimate shipping vanished. Map showing only shadow fleet tankers transiting. Visual metaphor: when you drain the ocean, you see what's on the bottom.

---

## Narrative Arc

1. **Open with the October 2025 anomaly** - 52 tankers suddenly visible. What did we see? What does it tell us about the network's structure?

2. **Zoom out to the network** - Build the full shadow fleet network from OFAC data. Show its structure. Identify the brokers and hubs.

3. **Apply the hero post framework** - Run dismantling simulations. Compare OFAC's actual strategy to optimal targeting. Is Treasury going after the right nodes?

4. **Measure adaptation** - Show how the network responds. Reflagging, replacement vessels, topology changes. The hydra effect.

5. **The Hormuz punchline** - After the strikes, the only ships moving were shadow fleet. The sanctions evasion network became the *de facto* energy supply chain. What does it mean when the shadow becomes the only thing left?

---

## Data Acquisition Plan

### Definitely available (public, structured)
- [ ] OFAC SDN list - vessel names, IMO numbers, ownership chains, designation dates
- [ ] IODA internet shutdown data (for supporting context)
- [ ] Bonbast.com rial exchange rate (for supporting context)

### Probably available (public, may need scraping)
- [ ] UANI tanker tracker - vessel details, tracking data
- [ ] Marine Traffic free tier - basic vessel info for specific IMO numbers

### Available as published aggregates (not raw data)
- [ ] Kpler oil flow statistics (cited in media)
- [ ] Windward AIS behavior reports
- [ ] CSIS Bella-1 analysis (detailed case study)

### Priority 1: Start with OFAC SDN list
The SDN list alone gives us enough to build the vessel-company network and run dismantling analysis. Everything else enriches but isn't essential.

---

## Open Questions

1. **Scope control:** The full shadow fleet is ~3,000 vessels. The OFAC-designated subset is smaller (~200-300?). Should we focus only on the designated subset (cleaner data) or try to capture the full fleet (more ambitious but data-limited)?

2. **Temporal resolution:** Do we have enough data points to show network evolution over time, or is this more of a snapshot analysis?

3. **Tone:** The hero post was playful ("What if we used network science to catch drug dealers?"). This subject involves active conflict, civilian casualties, and economic suffering. Need a register that's still engaging but appropriately serious. Maybe: "The US Treasury is running the world's largest network dismantling experiment. Here's how to grade their homework."

4. **Ethical considerations:** We'd be analyzing a sanctions enforcement campaign. Some readers will see sanctions as justified; others see them as causing civilian suffering. The piece should be analytically neutral - evaluating *effectiveness*, not *morality*.
