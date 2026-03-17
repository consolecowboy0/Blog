---
title: "Ghost Ships"
date: "2026-03-17"
description: "The US Treasury is running the world's largest network dismantling experiment on Iran's shadow fleet. I graded their homework."
---

A few weeks ago I wrote about superheroes. I took a real drug trafficking network- 110 people, mapped from wiretaps- and tested four strategies for tearing it apart. The Detective won. She found the brokers, the bridges between factions, and pulled them out. Four moves. Network shattered. My kid was impressed.

After I published that piece, I couldn't stop thinking about something. The dismantling strategies I tested- hub removal, broker removal, edge severing, random policing- those aren't hypothetical. Governments run these plays for real. Right now, in real time, the United States Treasury is executing what might be the largest network dismantling campaign in history. Not against 110 drug traffickers in Montreal. Against roughly three thousand oil tankers scattered across every ocean on earth.

Iran's shadow fleet.

I wanted to see if the same framework applied. Whether the math that made The Detective the best superhero could tell us something about whether the US government is any good at taking apart a sanctions evasion network that moves billions of dollars in crude oil through an invisible supply chain.

So I pulled the data. And the answer is more complicated- and more interesting- than I expected.

---

## The Invisible Armada

Here's the setup. Iran exports oil. The world (mostly) doesn't want Iran to export oil, because nuclear weapons and all that. So since 2018, the US has maintained sanctions designed to drive Iranian oil exports to zero. In September 2025, the United Nations reimposed its own sanctions through the snapback mechanism. On paper, Iran shouldn't be able to sell a barrel.

Iran sells about 1.4 million barrels a day.

How? The shadow fleet. A network of roughly three thousand tankers that use every trick in the book to move Iranian crude from loading terminals in the Persian Gulf to refineries in China, Syria, and wherever else will take it. These aren't pirate ships with skull flags. They're regular oil tankers- some of them former mainstream commercial vessels- that have been absorbed into an ecosystem of shell companies, fake registrations, and deliberate electronic deception.

The core trick is AIS manipulation. Every commercial ship is required to broadcast its position via the Automatic Identification System- think of it as a GPS transponder that tells the world where you are, how fast you're going, and what you're carrying. Shadow fleet tankers either turn their AIS off entirely (going "dark") or spoof it- broadcasting false coordinates that show them cruising the Pacific while they're actually anchored off Kharg Island taking on Iranian crude.

The typical shadow fleet voyage looks like this. A tanker registered in Panama, owned by a shell company in the UAE, insured by a firm in New Zealand, crewed by nobody-knows-who, goes dark for thirty days in Iranian waters. When its transponder flickers back on, it's sitting off the coast of Shandong Province, lighter by two million barrels. A ship-to-ship transfer somewhere in the middle- probably in the waters off Oman or Malaysia- moved the cargo from the first tanker to a second one with cleaner paperwork, which carried it the rest of the way.

Rinse. Repeat. One point four million barrels per day.

It's a network. A big, sprawling, deliberately opaque network. And that means it has a topology. And topology is something I know how to measure.

---

## Building the Graph

In the superhero piece, I had a clean dataset- 110 nodes, 295 edges, everything mapped from wiretaps. The shadow fleet doesn't hand you an adjacency matrix. You have to build one from the wreckage.

My primary data source is the one that's fully public and structured: the OFAC SDN list. Every time the US Treasury sanctions a vessel, a company, or an individual connected to the shadow fleet, it goes on this list. Each entry includes the vessel name, its IMO number (a permanent ID that follows a ship through name changes and reflaggings), the registered owner, the operator, the flag state, and- critically- linked entities. Company A owns Vessel B which is managed by Company C which shares an address with Company D.

Those links are edges. The vessels and companies are nodes. And when you string them all together, you get a network.

I supplemented the OFAC data with published analyses from UANI's tanker tracker, CSIS's deep dive on the tanker Marinera, and Windward's maritime intelligence reports. Between these sources I was able to construct a bipartite network- vessels on one side, companies on the other- covering the sanctioned portion of the shadow fleet.

Here's what it looks like.

![The shadow fleet network. Vessels in blue, companies in orange, sized by degree. A handful of intermediary companies connect clusters of vessels that would otherwise be isolated.](/images/charts/shadow_fleet_network.png)
*Fig. 1: The shadow fleet sanctions network. Blue nodes are vessels, orange are companies. Size indicates degree (number of connections). The handful of large orange nodes in the center are the ship managers and beneficial owners that tie the whole thing together.*

Two things jump out immediately.

First: it's clustered. Not one giant hairball, but several distinct groups of vessels organized around specific management companies. Each cluster operates semi-independently- its own set of vessels, its own ownership chain, its own flag state preferences. This matters because it tells you the network isn't a monolith. It's modular. Which means dismantling one cluster doesn't necessarily affect the others.

Second: the clusters are connected by a relatively small number of intermediary nodes. Shared insurers. Shared flag registries. Shell companies that appear in the ownership chains of vessels belonging to different clusters. These are the brokers. The bridges. The load-bearing walls.

If you've read the superhero piece, you know where this is going.

---

## Grading Treasury's Homework

The OFAC SDN list isn't just a roster. It has timestamps. I know when each vessel and company was designated. Which means I can replay Treasury's campaign as a sequence of node removals and measure what happens to the network after each one.

In 2025 alone, OFAC sanctioned over 875 persons, vessels, and aircraft tied to Iranian sanctions evasion. In January 2026, they hit 9 more vessels and 8 firms. In February, a massive tranche- 30 entities, individuals, and vessels in a single action, plus India seizing three Iranian tankers and the US physically seizing four more.

Each of those is a data point. A node removed from the graph. I can measure the largest connected component, the number of fragments, the average path length- the same metrics I used to score The Bruiser, The Detective, The Ghost, and The Random.

So how's Treasury doing?

Better than The Random. Not as well as The Detective.

Treasury's targeting strategy is primarily degree-based- they're going after the most visible, most active vessels. The ones that show up in satellite imagery at Iranian terminals. The ones Kpler flags as loading Iranian crude. This is The Bruiser's playbook: find the biggest node and hit it.

And it works. Up to a point. After the February 2026 sanctions tranche, Kpler reported Iranian crude loadings had fallen 26% to below 1.39 million barrels per day. That's a real impact. Real barrels not moving. But the network hasn't shattered. The largest connected component in my reconstruction is still intact. The clusters reroute.

Why? Because Treasury is targeting vessels- the leaf nodes of the network- more than the intermediary companies that connect them. Taking out a single tanker removes one node with maybe two or three edges. Taking out the ship management company that operates fifteen tankers would remove one node with fifteen edges and orphan an entire cluster. That's the difference between The Bruiser and The Detective. The Bruiser hits what's visible. The Detective maps the structure first and hits what's *load-bearing*.

To be fair to Treasury, they know this. The February 2026 action specifically targeted management companies and procurement networks, not just vessels. And the India seizures- physical interdiction of sanctioned tankers in port- add a dimension that pure network analysis can't capture, because a tanker sitting impounded in an Indian port isn't just a removed node; it's a warning to every port operator in the region. The edges don't just disappear. They preemptively refuse to form.

But the data suggests there's room to improve. The highest-betweenness nodes in my reconstruction- the insurance providers and flag registries that bridge multiple clusters- have been underrepresented in sanctions tranches relative to their structural importance. Taking out one New Zealand-based insurer that underwrites forty shadow fleet vessels would do more to fragment the network than sanctioning forty individual tankers.

Reuters, to their credit, [exposed exactly this](https://www.reuters.com/) in October 2025 when they identified Maritime Mutual Insurance Association as a key enabler. But exposure and enforcement are different things.

---

## October 2025: Three Days of Light

Now for the part that genuinely surprised me.

On October 12, 2025, something unprecedented happened. Fifty-two of eighty-eight Iran-flagged tankers simultaneously turned their AIS transponders back on.

Not one or two ships. Not a gradual shift. Fifty-two. In the same 72-hour window. After years of sustained dark activity- some vessels had been dark for months, even years. It was like someone flipped a switch on an entire fleet.

Why? The reimposition of UN sanctions in September 2025 changed the calculus. Chinese ports and insurers, under new pressure, started demanding that arriving vessels have clean AIS records. No AIS history, no berth. No berth, no discharge. No discharge, no payment. The economic logic that kept transponders dark suddenly reversed.

This is the most interesting data event in the entire shadow fleet story. Not because it disrupted the network- the tankers went dark again after three days when enforcement pressure proved inconsistent- but because of what it revealed while the lights were on.

For seventy-two hours, the dark fleet was visible. AIS records showed exactly where every vessel was sitting. How many were in Iranian waters. How many were at known ship-to-ship transfer coordinates. How many were already en route to Chinese ports.

It was like briefly turning on the lights at a party you weren't supposed to know was happening. For three days, you could see the guest list.

Windward's analysis of those three days showed a fleet that was far more organized than the common "rogue tankers" narrative suggests. Vessels weren't randomly scattered. They were positioned at predictable waypoints along well-established routes- staging areas, transfer zones, waiting anchorages- that implied centralized coordination. Someone was running logistics for this fleet. Not loosely. Tightly.

This matters for network analysis because it confirms that the shadow fleet isn't just a collection of independent opportunists. It has structure. It has coordination. It has *brokers*. And brokers are exactly what The Detective is designed to find.

---

## Hormuz: The Last Ships Standing

On February 28, 2026, the United States and Israel launched strikes against Iranian military and nuclear facilities. The Supreme Leader was killed. Iran's retaliatory capabilities were severely degraded. The geopolitical implications are enormous and ongoing.

But I want to zoom in on one very specific, very weird consequence.

Within 48 hours of the strikes, 90 percent of legitimate commercial shipping vanished from the Strait of Hormuz. Insurers pulled coverage. Port authorities issued warnings. Mainstream tanker companies diverted around the Cape of Good Hope. The strait- through which roughly 20 percent of the world's oil supply normally transits- was functionally closed to above-board shipping.

Except for the shadow fleet.

Shadow fleet tankers, already uninsured by mainstream providers, already operating outside the normal regulatory framework, already accustomed to navigating hostile waters without the safety net of international maritime law- they kept moving. For a bizarre window in late February and early March 2026, the sanctions evasion network became essentially the *only* energy supply chain still operating through Hormuz.

I'll say that again because it's genuinely strange. The fleet that was built to *circumvent* the global energy system briefly became the global energy system. The shadow was the only thing left standing.

NetBlocks measured Iranian internet connectivity at 4 percent of normal after the strikes. Brent crude surged 13 percent to $82 per barrel. The rial- already at a record low of 1.5 million to the dollar- went into freefall. And through it all, shadow tankers kept transiting the strait, moving crude from the same terminals they'd been servicing for years, as if the war were someone else's problem.

From a network resilience perspective, this is a textbook case of what happens when you partially dismantle a network without fragmenting it. The shadow fleet lost nodes to sanctions. It lost edges to interdiction and enforcement pressure. But its core topology survived. The brokers were still there. The routes were still there. The institutional knowledge- which anchorages are safe, which ports will look the other way, which coordinates work for ship-to-ship transfers- none of that was destroyed.

The network degraded. It didn't shatter. And when the legitimate competitors disappeared overnight, it was the last one standing.

In the superhero piece, I showed what happens when you use the wrong strategy against a criminal network. The Random- uninformed policing without structural targeting- barely scratches the network even after dozens of operations. The network persists. The nodes reroute. The communication lines find new paths.

The shadow fleet, right now, is a network that's been hit with a mix of Bruiser moves (sanction the most visible vessels), some Detective moves (target key management companies), a few Ghost moves (sever insurance and port access edges), and a lot of Random (sporadic enforcement that catches whoever happens to be in the wrong place). The result is exactly what the simulation predicts: partial degradation, not collapse. A network that's smaller, more cautious, and still fundamentally operational.

---

## What Would The Detective Do?

If I were advising Treasury- and I am absolutely not, I am a person with a blog and a Python script- the network topology suggests three things.

**First: target the insurers and flag registries, not the vessels.** In my reconstruction, the highest-betweenness nodes aren't tankers. They're the handful of companies that provide services across multiple clusters: insurance, flag registration, ship management. These are the bridges. Removing a vessel removes a leaf. Removing a bridge company fragments entire clusters. The Maritime Mutual Insurance exposure in October 2025 was the right instinct. Do more of that. The Cameroon flag registry that saw 20 reflaggings in 30 days? That's a high-betweenness node being actively exploited as a replacement bridge.

**Second: exploit the downstream chokepoints.** The October 2025 AIS event proved that Chinese port operators and commercial insurers have more leverage over fleet behavior than direct sanctions enforcement. Fifty-two tankers changed behavior overnight because of *commercial incentives*, not because OFAC sent a letter. The most effective dismantling strategy might not be removing nodes at all- it might be making the edges too expensive to maintain. That's a variant of The Ghost's strategy, but targeted at specific high-value edges rather than random ones.

**Third: accept that partial dismantling creates a more resilient adversary.** This is the finding from Duijn, Kashirin, and Sloot (2014) that I cited in the superhero piece but didn't linger on: disrupting criminal networks can make them *more efficient*. The nodes that survive a sanctions campaign are, by definition, the ones that adapted. The routes that still work are the hardest to detect. Each round of enforcement prunes the weak branches and leaves the strong ones. You're performing natural selection on a network that learns.

The shadow fleet of March 2026 is smaller, darker, and better at hiding than the shadow fleet of 2024. That's not a failure of sanctions. It's what network science predicts will happen when you partially dismantle a scale-free network.

---

## The Lights Come On

My son asked if he could be a superhero and I built a simulation. That was fun.

This isn't fun. The shadow fleet isn't an abstract graph-theory puzzle. It exists because of sanctions that are crushing an Iranian economy where ordinary people can barely afford food. The rial has lost half its value in a year. The internet has been down for sixty-six days and counting. At least fifty-one protesters are confirmed dead, and the real number during the January blackout is unknowable because the government shut off the tool we'd use to count.

The fleet also exists because someone is buying the oil. China imports roughly 90 percent of Iran's crude exports. That trade relationship, disguised under layers of shell companies and dark transponders, funds a government that shoots protesters and cuts its citizens off from the rest of the world. The network I'm analyzing isn't a crime being committed against Iran. It's a crime being committed *by* Iran, *enabled* by a global infrastructure of willing participants, and *targeted* by a sanctions regime that is structurally sophisticated but topologically incomplete.

I can't fix that with a Python script. But I can see the structure. I can measure which interventions work and which don't. And the math says the same thing it said in the superhero piece: you don't beat a network by hitting the biggest node. You beat it by finding the bridges.

The Detective didn't win because she was the strongest. She won because she saw what nobody else could see- the load-bearing connections hiding in plain sight.

There are load-bearing connections in the shadow fleet. Some of them turned their lights on for three days in October, and then turned them off again. Some of them were the only ships still moving through Hormuz after the bombs fell.

They're out there right now. Transponders dark. Routes memorized. Waiting to be found.

---

*The network in this article was reconstructed from the OFAC Specially Designated Nationals list, UANI tanker tracking data, Windward Maritime AI published reports, and the CSIS analysis of the Marinera (formerly Bella-1). Fleet behavior data from Kpler and NetBlocks. Internet connectivity measurements from IODA (Georgia Tech), Cloudflare Radar, and NetBlocks. Exchange rate data from Bonbast. The dismantling framework is the same one from the superhero piece- betweenness centrality targeting vs. degree targeting vs. random removal- applied to a bipartite vessel-company network. Analysis in Python using NetworkX. The kid still wants to be a superhero. I haven't told him about this one yet.*
