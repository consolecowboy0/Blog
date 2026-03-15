## One Number, Fifty Years

Here's where I show you the chart and pretend to be surprised by what it says.

![Bridge Index over time, 93rd-118th Congress. The line does exactly what you think it does.](../output/charts/bridge_index_timeline.png)
*Fig. 1: The Bridge Index, 1973-2023. A half-century of Congress forgetting how to talk to itself.*

The Bridge Index starts at 233 in the 93rd Congress - that's 1973, Watergate era, a moment we don't exactly remember as a golden age of comity. And yet. By the 118th Congress in 2023, it's fallen to 129. That's a 45% decline in cross-partisan connectivity over fifty years. If your retirement portfolio did that, you'd fire your advisor. If your blood pressure did that, you'd be dead.

But here's the thing that stopped me mid-analysis, the thing that makes this more than just a "polarization is bad" story with a downward-sloping line: the decline isn't linear. It's not a slow, steady erosion. The data breaks.

I ran change-point detection - specifically PELT with binary segmentation, for the methods nerds in the audience - and it consistently flags one Congress as the primary structural break. Not the one you'd guess. Not the 104th, when Gingrich took the Speaker's gavel. Not the 112th, when the Tea Party stormed in. The algorithm points to Congress 102.

Congress 102. 1991-1992.

Let that sit for a second.

The last Congress before Newt Gingrich became Minority Whip and started rebuilding the Republican Party as a parliamentary opposition force. The break didn't happen when the revolution arrived. It happened in the last moment before the revolution was possible. The ground shifted before anyone noticed the earthquake.

Here are the numbers that tell that story. In the 93rd Congress, 4,513 cross-party cosponsorship edges, algebraic connectivity of 3.95, Bridge Index of 233. A dense, tangled network where party labels mattered less than committee assignments and regional interests. By the 102nd Congress - the break point - edges had dropped to 2,994 and algebraic connectivity had cratered to 0.98. That connectivity number matters more than it looks. Algebraic connectivity measures how hard it is to split a network into disconnected pieces. At 3.95, you'd have to work to break the network apart. At 0.98, one good shove would do it.

The shove came.

The 104th Congress - Gingrich's revolution, the Contract with America, the government shutdowns - drops to 2,503 edges and a Bridge Index of 183. The secondary break point the algorithm flags is Congress 107, 2001-2002, right after the brief post-9/11 unity evaporated. Then the Tea Party wave in the 112th Congress pushes it to 147. And by today's 118th Congress, we're at 129 with just 1,384 cross-party edges.

I want to be careful here. I'm not arguing that Gingrich caused polarization the way a match causes a fire. The 102nd Congress break suggests the kindling was already dry. What the data shows is a system that was gradually losing redundancy - losing the overlapping connections that let it absorb shocks - until it hit a threshold where those shocks could actually fracture the structure. That's not a story about villains. It's a story about phase transitions.

Which brings me to the smoking gun.

## The Smoking Gun

Look at these four network snapshots side by side. Please actually look at them - I spent an unreasonable number of hours getting the layout algorithm right.

![Four network snapshots: 93rd, 102nd, 112th, and 118th Congress. Watch a network die in four frames.](../output/charts/network_snapshots.png)
*Fig. 2: Four Congresses, four snapshots. The purple connections in the 93rd are cross-party edges. Notice how they're mostly gone by the 118th.*

The 93rd Congress is a hairball. That's a technical term - okay, it's not, but network scientists actually use it - meaning the graph is so dense with cross-party connections that you can barely distinguish the two parties. Purple edges everywhere, Democrats and Republicans tangled together like earbuds in a pocket. The 102nd starts showing daylight between the clusters. The 112th is two distinct blobs connected by thin bridges. And the 118th? Two islands. The handful of remaining cross-party edges look less like bridges and more like the last threads of a fraying rope.

But maybe you don't trust my eyeballing of network diagrams. Fair. I don't either. So here's the validation test I ran: take four completely independent metrics - the Bridge Index (my composite measure), ideological overlap between the parties (from DW-NOMINATE scores), the bipartisan voting rate on roll calls, and raw edge density - and plot them on the same timeline.

![Four independent metrics, all breaking at the same point.](../output/charts/validation_overlay.png)
*Fig. 3: Four metrics. Four different data sources. One break point. I did not plan this.*

They all break at the same point. The Bridge Index, which is built from cosponsorship networks. The ideology overlap, which comes from roll-call vote scaling. The party-line voting rate, which is a simple count of party-unity votes. And edge density, which is just the ratio of actual connections to possible connections. Four different measures, constructed from different data, using different methodologies, all pointing at the same moment.

That's not a coincidence. That's a phase transition.

The correlations confirm it. Bridge Index versus party distance: Spearman's rho of -0.986, with a p-value somewhere south of 10 to the negative 20th. For context, a correlation that strong means these two numbers are basically the same number wearing different hats. Bridge Index versus party-line voting rate: rho of -0.969. Edge density versus party-line voting: -0.984. I've worked with social science data for years and I have never seen correlations this clean outside of a textbook. These aren't noisy trends. They're lockstep.

Now look at the raw edge count over time.

![Cross-party edges declining from 4,513 to 1,384 over 26 Congresses.](../output/charts/edge_decline.png)
*Fig. 4: 4,513 to 1,384. Each missing line is a bipartisan relationship that stopped existing.*

From 4,513 cross-party cosponsorship edges in the 93rd Congress to 1,384 in the 118th. That's a 69% decline. Three out of every four cross-party connections, gone. And remember what an edge means here - it means a Democrat and a Republican chose to put their names on the same piece of legislation. Each missing connection isn't an abstraction. It's a bill that couldn't find a cosponsor across the aisle. It's a policy conversation that never started. It's a relationship that either broke or never formed.

The average cross-party degree tells the same story from a different angle. In 1973, the typical House member had about 21 cosponsorship relationships with members of the other party. By 2023, that number is 6. The median legislator went from having a whole network of cross-party colleagues to having a handful. You can't build coalitions with a handful.

One more number, because I think it matters. Algebraic connectivity - that measure of how easily the network can be split - averaged 3.93 across the first ten Congresses in our dataset (93rd through 102nd). Across the last ten (109th through 118th), it averaged 0.86. The network didn't just lose edges. It lost structural integrity. A network with algebraic connectivity below 1.0 is, in a very precise mathematical sense, barely holding together.

I started this analysis expecting to find polarization. Everyone finds polarization - it's the free space on the political science bingo card. What I didn't expect was how clean the break would be, how precisely the data would converge on a single moment, and how much the story would look less like a gradual cultural drift and more like an engineering failure. A bridge doesn't collapse because one cable snaps. It collapses because enough cables have quietly corroded that the next truck to cross is the last one.

Congress 102 was the last truck.
