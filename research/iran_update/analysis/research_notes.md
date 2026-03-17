# Iran Research Update - March 2026

## The Situation

Iran is in the middle of a cascading crisis. The threads are: a currency collapse, mass protests, an internet blackout, a shadow tanker fleet playing cat-and-mouse with sanctions enforcement, a failed nuclear negotiation, and then - starting February 28 - US-Israeli military strikes that killed the Supreme Leader and targeted nuclear sites. Each of these threads generates data. The question is which data story is the most interesting to investigate.

---

## Three Data Angles Worth Pursuing

### 1. The Shadow Fleet: AIS Dark Activity and Sanctions Evasion Networks (STRONGEST ANGLE)

**The pitch:** Iran runs the world's largest oil sanctions evasion operation through ~3,000 "shadow fleet" tankers. These vessels systematically disable or spoof their AIS transponders to avoid detection while conducting ship-to-ship transfers of crude oil. The cat-and-mouse game between sanctions enforcers and the shadow fleet generates massive amounts of trackable data.

**Why this is compelling:**
- It's a *network analysis* problem - exactly the kind of thing this blog does well. The hero post used network dismantling strategies on a drug trafficking network. Shadow fleet tracking is the same concept applied to a live, active sanctions evasion network.
- There was a fascinating anomaly in October 2025: 52 of 88 Iran-flagged tankers *simultaneously* turned their AIS transponders back on for three days after years of dark activity. This was apparently because the return of UN sanctions made Chinese ports and insurers demand vessels keep tracking on. That's a measurable behavioral shift across an entire fleet.
- UANI (United Against Nuclear Iran) maintains a public tanker tracker using AIS, satellite imagery, and cargo data.
- Kpler publishes aggregate data showing Iranian crude loadings fell 26% to below 1.39 million bpd in January 2026.
- OFAC sanctioned 84% of tankers involved in lifting Iranian crude in 2025. You can track the effect of each sanctions tranche on fleet behavior.
- The Strait of Hormuz closure post-strikes (Feb 28) created a bizarre situation where *only* shadow fleet tankers were still moving through - 90% of legitimate shipping vanished.

**Data sources:**
- UANI Tanker Tracker (public)
- Marine Traffic / VesselFinder AIS data
- Windward Maritime AI reports
- Kpler shipping analytics
- OFAC sanctions designations (structured data)
- CSIS Bella-1/Marinera case study (379 suspicious rendezvous events, 17 dark periods)

**Story structure:** Could frame it as "network dismantling" again - the US is trying to dismantle a sanctions evasion network using the same strategies (targeting high-betweenness nodes like key intermediary vessels/companies). How effective is each approach? Does designating vessels actually remove them from the network, or do they just reflag?

---

### 2. Measuring Silence: Iran's Internet Blackouts as Data (STRONG ANGLE)

**The pitch:** Iran has shut down the internet four times during protests (2019, 2022, 2025, 2026). Each shutdown is measurable through multiple independent data sources - BGP routing tables, active probing, network telescope data, Cloudflare traffic. The 2026 shutdown (January 8 - present, still ongoing as of March 15) is the most sophisticated and severe in history.

**Why this is compelling:**
- IODA at Georgia Tech has a direct comparative dataset across all four shutdowns. They published a report explicitly titled "A Comparative Look at Internet Shutdowns in Iran: 2019, 2022, 2025, and 2026."
- The technical evolution is fascinating. In 2019 they used blunt BGP withdrawal (pulled all routes). In 2026 they left IPv4 BGP routes *up* while blocking traffic at a lower layer - a "stealth outage" that looks connected on paper but is dead in practice. You need *multiple* data sources to see the full picture.
- All of Iran's international internet traffic passes through just two gateways (TIC and IPM), both state-controlled. That's an incredibly constrained topology. The infrastructure itself tells the story of how state control was engineered.
- The economic cost is quantified: $35.7 million/day according to Iran's own communications minister. Online sales fell 80%. Tehran Stock Exchange lost 450,000 points in four days.
- There's a correlation analysis opportunity: internet shutdowns vs. protest intensity, currency movements, and economic indicators.

**Data sources:**
- IODA (ioda.inetintel.cc.gatech.edu) - BGP, active probing, telescope data (public)
- Cloudflare Radar - traffic volume data (public)
- NetBlocks - connectivity measurements (public)
- Kentik - BGP/routing analysis
- OONI (Open Observatory of Network Interference) - censorship measurement

**Story structure:** "How do you measure silence?" - tracking the evolution of state censorship through the data it leaves behind. Each shutdown is more sophisticated, but also leaves more forensic traces because the measurement tools have improved too.

---

### 3. The Rial Death Spiral: Currency Collapse as Event Timeline (MODERATE ANGLE)

**The pitch:** The Iranian rial went from ~817,000/$ (Jan 2025) to ~1.7 million/$ (Mar 2026) - losing roughly half its value in a year. But the decline isn't smooth; it's punctuated by sharp drops that correlate precisely with external events. You can read Iran's geopolitical timeline purely through its exchange rate.

**Why this is compelling:**
- The data tells a clean chronological story: sanctions reimposition → rial drop. War → rial drop. Central bank governor resignation → rial drop. Protests → rial drop.
- The Governor of the Central Bank took office with the rial at 430,000 (Dec 2022) and resigned with it at 1.42 million (Dec 2025). That's a 230% decline on his watch.
- Capital flight data from the Central Bank of Iran is newly available and shows money leaving just as oil revenues decline - a scissors pattern.
- The gap between the official rate (42,000) and the street rate (1.7 million) is a 40:1 ratio - one of the largest official/unofficial exchange rate gaps in the world.

**Data sources:**
- Bonbast.com (unofficial exchange rate tracker, widely cited)
- Central Bank of Iran published data
- IMF/World Bank macro projections
- Iran Open Data estimates on oil revenue

**Limitation:** This is more of a "chart essay" than a deep data investigation. The exchange rate data is interesting but somewhat one-dimensional compared to the network complexity of the shadow fleet or the multi-layered measurement challenge of internet shutdowns.

---

## Recommendation

**Primary angle: Shadow Fleet AIS Tracking (#1)**

This is the strongest fit for this blog. It's a network analysis problem with publicly available data, deceptive actors trying to hide in plain sight, and a direct parallel to the hero post's network dismantling analysis. The October 2025 AIS anomaly (fleet-wide behavioral shift) and the post-Hormuz-closure data (shadow fleet as last ships standing) are both distinctive, specific findings that could anchor a piece.

**Secondary angle: Internet Blackout Measurement (#2)**

This is the backup if the AIS data proves too hard to acquire or too noisy. The IODA comparative dataset is clean, well-documented, and publicly available. The "measuring silence" framing is evocative. Could be combined with the primary angle as a two-part series.

**The rial angle (#3)** works best as supporting context within either of the other two stories rather than as a standalone piece.

---

## Key Questions to Resolve

1. **Data access for shadow fleet:** UANI's tanker tracker is public but may not offer downloadable datasets. Need to investigate API access or whether scraping is feasible. Windward and Kpler are commercial - may need to work from their published reports instead.
2. **Scope:** Should the piece focus on the October 2025 AIS anomaly as a specific event, or try to tell the broader story of shadow fleet evolution?
3. **Recency:** Events are still developing (Strait of Hormuz situation, ongoing internet blackout). Should we wait for more data or work with what's available?
4. **Ethical framing:** This is about sanctions enforcement and conflict. The blog's tone is playful and irreverent - need to calibrate for subject matter that involves real human suffering (protests, civilian casualties, economic collapse).
