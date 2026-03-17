# Iran Update - Data Sources Evaluation

## Shadow Fleet / AIS Tracking

### UANI Tanker Tracker
- **URL:** https://www.unitedagainstnucleariran.com/tanker-tracker
- **What it offers:** AIS tracking, satellite imagery, vessel comparison, tanker classification, cargo datasets for Iranian oil/gas exports
- **Access:** Public web interface. Unclear on bulk data access or API.
- **Quality:** High. UANI is the gold standard for Iran sanctions evasion tracking. Cited by OFAC, State Department, and major media.
- **Recommendation:** Primary source. Need to investigate data export options.

### Windward Maritime AI
- **URL:** https://windward.ai
- **What it offers:** Vessel reflagging patterns, AIS behavior analysis, ownership change tracking, sanctions risk scoring
- **Access:** Commercial platform. Published reports and blog posts with aggregate data are freely available.
- **Quality:** High. Used by governments and financial institutions.
- **Recommendation:** Use published reports for aggregate statistics.

### Kpler
- **What it offers:** Cargo tracking, oil flow data, port-level loading/discharge volumes
- **Access:** Commercial. Published data frequently cited in media (e.g., the 26% decline in Iranian loadings stat).
- **Quality:** Industry standard for commodity flow tracking.
- **Recommendation:** Use media-cited figures. Direct access likely prohibitively expensive.

### OFAC Sanctions Designations
- **URL:** https://ofac.treasury.gov (SDN List)
- **What it offers:** Structured data on every sanctioned vessel, entity, and individual. Includes vessel names, IMO numbers, flag states, ownership chains.
- **Access:** Public. Downloadable in XML/CSV format.
- **Quality:** Authoritative - this IS the sanctions list.
- **Recommendation:** Essential. Can build network graph of sanctioned entities and their connections. Track designation dates to measure enforcement waves.

### Marine Traffic / VesselFinder
- **What it offers:** AIS position data, vessel details, port calls
- **Access:** Free tier with limited history. API access is paid.
- **Recommendation:** Useful for spot-checking specific vessels. Not viable for bulk fleet analysis without paid access.

### CSIS Analysis (Bella-1 / Marinera Case Study)
- **URL:** https://www.csis.org/analysis/what-bella-1-teaches-us-about-targeting-shadow-fleets
- **What it offers:** Detailed AIS analysis of a single vessel - 379 suspicious rendezvous events, 17 dark periods, loitering patterns
- **Quality:** Excellent methodology documentation.
- **Recommendation:** Use as a case study template for how to analyze individual vessel behavior.

---

## Internet Shutdown Measurement

### IODA (Internet Outage Detection and Analysis)
- **URL:** https://ioda.inetintel.cc.gatech.edu
- **What it offers:** Three measurement types - BGP route announcements, active probing (responsiveness), network telescope (unsolicited traffic). Historical data across all four Iran shutdowns (2019, 2022, 2025, 2026).
- **Access:** Public dashboard with time-series data. Research reports freely available.
- **Quality:** Academic-grade. Georgia Tech Internet Intelligence Lab.
- **Recommendation:** PRIMARY SOURCE for internet shutdown analysis. Clean comparative dataset exists.

### Cloudflare Radar
- **URL:** https://radar.cloudflare.com
- **What it offers:** Real-time traffic volume data, attack patterns, protocol distribution. Country-level and AS-level granularity.
- **Access:** Public dashboard. API available.
- **Quality:** Cloudflare sees ~20% of global web traffic. Massive sample.
- **Recommendation:** Essential for traffic-volume perspective. Complements IODA's infrastructure-level view.

### NetBlocks
- **URL:** https://netblocks.org
- **What it offers:** Real-time network connectivity monitoring, country-level scores
- **Access:** Public. Real-time alerts and reports.
- **Quality:** Good for event detection and timestamping. Less granular than IODA.
- **Recommendation:** Use for precise shutdown/restoration timestamps.

### OONI (Open Observatory of Network Interference)
- **URL:** https://ooni.org
- **What it offers:** Censorship measurement from volunteer probes inside countries. Tests website/app accessibility, protocol blocking.
- **Access:** Public data. API available. Community-contributed.
- **Quality:** Ground truth from inside Iran (when probes are active). Coverage depends on volunteer availability - likely sparse during total shutdowns.
- **Recommendation:** Valuable for pre-shutdown censorship patterns and partial-restoration phases.

---

## Economic / Currency Data

### Bonbast.com
- **What it offers:** Unofficial Iranian exchange rate tracker (rial vs. USD, EUR, GBP, etc.)
- **Access:** Public. Widely cited as the standard source for open-market Iranian exchange rates.
- **Quality:** Market-derived. Reflects actual trading conditions vs. the fictional official rate.
- **Recommendation:** Primary source for rial exchange rate time series.

### Central Bank of Iran
- **What it offers:** Official economic statistics, capital flow data, inflation figures
- **Access:** Public reports. Data quality varies.
- **Quality:** Useful but government-curated. Cross-reference with independent sources.
- **Recommendation:** Use for capital flight and macro data, with appropriate caveats.

### IMF / World Bank
- **What it offers:** GDP projections, inflation forecasts, macro outlook
- **Access:** Public.
- **Recommendation:** Use for third-party validation of economic trajectory.

### Iran Open Data
- **What it offers:** Independent estimates of oil revenue, sanctions-evasion costs
- **Quality:** Good. Estimated the ~$5 billion sanctions-evasion cost gap in 2024-25.
- **Recommendation:** Useful for revenue-impact calculations.

---

## Data Accessibility Summary

| Source | Access Level | Data Format | Best For |
|--------|-------------|-------------|----------|
| OFAC SDN List | Public, downloadable | XML/CSV | Network graph of sanctioned entities |
| IODA | Public dashboard | Time-series | Internet shutdown measurement |
| Cloudflare Radar | Public dashboard + API | Time-series | Traffic volume during shutdowns |
| UANI Tanker Tracker | Public web | Web interface | Fleet-level AIS behavior |
| Bonbast.com | Public | Exchange rates | Rial time series |
| Kpler | Commercial (media citations) | Aggregates | Oil flow volumes |
| Windward | Commercial (blog posts) | Reports | AIS pattern analysis |
