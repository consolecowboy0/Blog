## Two Kinds of Legislator

Let's make up two kinds of members of Congress.

The first kind I'll call a **bridge** member. A bridge cosponsor bills with people on the other side of the aisle. They show up in both parties' networks, creating links between Democrat and Republican that wouldn't otherwise exist. They're the ones who make a bipartisan infrastructure bill or a veterans' healthcare package actually happen- not because they're moderates necessarily, but because they're willing to put their name on something alongside someone they disagree with on most other things.

The second kind I'll call a **bunker** member. A bunker only works within their own party. Every cosponsor on every bill they touch shares their jersey color. They might be incredibly productive legislators- sponsoring dozens of bills, building coalitions, whipping votes- but every connection they create stays inside the walls of their own party. They're not crossing the aisle. They're digging in.

Now here's the thing. In the 93rd Congress- that's 1973, right after Watergate- essentially every single member was a bridge. One hundred percent of the House had at least one cross-party cosponsorship. Every member. Think about that for a second. Four hundred and thirty-four people, spanning every ideology from Southern Democrat to Rockefeller Republican, all connected in a single unbroken web of cooperation.

By the 118th Congress- the one that seated in 2023- that number had dropped, and the connections that remained were thinner, weaker, concentrated among fewer members. The average representative went from cosponsoring bills with about 21 members of the other party to cosponsoring with about 6. That's not a gradual cooling. That's going from knowing everyone at the block party to nodding at the same three neighbors and pretending the rest of the street doesn't exist.

And what changed wasn't just the number of bridges. It was who became a bunker and why. But before I can show you that story, I need to explain the structure that makes bridges matter in the first place.

---

## The Graph That Runs America

Congress is a network. I don't mean that as a metaphor. I mean it in the precise, mathematical, graph-theory sense of the word.

Every member of the House is a **node**- a point in a network. Every time a Democrat cosponsors a bill with a Republican, that creates an **edge**- a line connecting those two points. String all those edges together across an entire two-year session of Congress and you get something that looks like a hairball on your screen but is actually a precisely defined mathematical object with measurable properties. You can compute how connected it is. You can identify which nodes are holding it together. You can calculate the exact point at which it breaks.

That last part is what I care about.

In network science there's a concept called a **phase transition**, and it's one of the most dramatic things in all of mathematics. The classic analogy is water turning to ice. You can cool water gradually- 50 degrees, 40 degrees, 35, 33, 32.1- and it's still water the whole way down. Liquid. Flowing. Connected. Then you cross 32 degrees Fahrenheit and the entire system reorganizes. It doesn't become slightly less watery. It becomes a fundamentally different substance. The molecules lock into a rigid crystal lattice and stop flowing entirely.

That is a phase transition. A small change in conditions produces a total change in structure.

Networks do this too. And the field that studies it is called **percolation theory**- originally developed to understand how fluids seep through porous rock, now one of the central frameworks in network science. Here's how it works: take a connected network and start removing edges. For a long time nothing much happens. The network gets a little thinner, a little less robust, but it stays fundamentally intact. There's still a path from any node to any other node. The system still functions as one body.

Then you cross a threshold. And it shatters.

Not gradually. Not one piece at a time. The giant connected component- the single web that links everyone together- fractures into isolated clusters that can't reach each other. Network scientists call this the **critical threshold**, and the mathematics that predicts when it happens are well understood. There's a criterion- developed by Molloy and Reed, if you want to look it up- that says basically this: the giant component survives as long as the network has enough high-degree nodes. Enough hubs. Enough connectors. When the number and influence of those connectors drops below a critical value, the whole structure comes apart.

I mean come on. Read that last paragraph again and tell me it doesn't sound like exactly what happened to Congress.

The bridge members are the high-degree connectors. They're the hubs that hold the bipartisan network together. And when those bridges disappear- when they get primaried out, or retire in frustration, or simply stop reaching across the aisle because the incentives changed- the network doesn't just get a little weaker. It approaches a critical threshold where the entire structure of cross-party cooperation can collapse into two disconnected components that literally cannot reach each other through the cosponsorship network.

That's not a metaphor. That's a measurement. And I built one.

---

## The Number That Tells You If Congress Is Liquid or Frozen

I needed a single metric that could capture this. Not just "are people cooperating less?"- we know that, everyone knows that, your uncle at Thanksgiving knows that. I needed a number that captures the structural health of the bipartisan network. Something that tells you whether Congress is functioning as one connected body or has fractured into two.

So I built what I'm calling the **Bridge Index**.

The Bridge Index combines three things. First: **participation breadth**- what fraction of Congress actually crosses the aisle at all? Are we talking about 100% of members maintaining at least one cross-party link, or are we down to a shrinking handful of holdouts keeping the whole thing alive? Second: **connection density**- among those who do cross party lines, how thick are the connections? One edge is technically a connection. Twenty edges is a relationship. Third: **evenness**- are the cross-party connections spread across the membership, or are they concentrated in a few super-connectors while everyone else hunkers down?

The formula multiplies these together: connected fraction times the square root of cross-party edge density times a measure of distributional evenness. That last factor penalizes networks where all the bridge-building falls on a few exhausted moderates while everyone else tweets about how the other side is destroying America. Because a network held together by three people isn't really held together at all.

One number. That's it. And it tells you whether Congress can function as a single body or has split into two.

In the 93rd Congress- 1973- the Bridge Index was 233. Nearly universal participation, dense cross-party connections, broadly distributed across the membership. That's a liquid system. Legislation can flow from one side to the other. Ideas percolate. Coalitions form and reform across party lines.

In the 118th Congress- 2023- the Bridge Index was 129. That's a 45 percent decline. Fewer members crossing the aisle, thinner connections among those who do, and the ones still trying are increasingly isolated. Right? Like just sit with that for a second. Almost half the connective tissue between the two parties dissolved over fifty years.

And the scariest part isn't where the number is now. It's the shape of the curve getting there. Because it doesn't decline steadily. It holds relatively stable through the 1970s and 1980s, then drops off a cliff around the 102nd Congress- that's 1991- and never recovers.

That's not decay. That's a phase transition.
