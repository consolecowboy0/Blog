---
title: "Can You Be a Superhero?"
date: 2026-03-15
description: "My son asked if he could be a superhero. I ran a simulation."
image: /charts/network.png
---

My son told me he wants to be a superhero when he grows up.

He's at that age where the line between real and impossible hasn't hardened yet. Where a cape is a career plan. He said it at dinner, totally matter-of-fact, like he was telling me he wants to be a dentist. And I looked at him and I did not say no. I didn't pivot to astronaut or firefighter.

Instead I did what I always do. I went to my computer and I started modeling.

I'm a data person. That's how I process the world. My kid asks a question, I build a simulation. It's not that I don't have feelings about it. It's that the feelings come *through* the data. And what he was really asking- underneath the cape and the mask- was a question worth taking seriously: *what kind of hero actually makes a difference?*

So I took a real drug trafficking network- 110 people, mapped from wiretaps and surveillance during a two-year investigation- and dropped it onto the map of my city. Not because it happened here. Because I needed to see what a superhero would be up against if it did.

Richmond, Virginia. Our streets. Our neighborhoods.

I built four superhero archetypes, four different strategies for dismantling a criminal network, and turned them loose. Then I measured what broke.

---

## The Network

The dataset comes from Project Caviar- a Canadian law enforcement investigation that ran from 1994 to 1996. Two years of wiretaps, surveillance, and careful documentation of a drug trafficking organization. Every phone call logged. Every connection mapped. What came out is a directed, weighted graph: 110 people connected by 295 edges, each edge representing communication between two members of the network.

I transposed it onto Richmond. I want to be clear about that- this network didn't operate here. But I needed it to feel local. I needed to look at the visualization and see my city underneath it, to feel the weight of what a real criminal organization looks like when it's layered over the places where my kid rides his bike.

Look at the network visualization. Nodes colored by community, sized by how connected each person is. Seven distinct clusters. Seven ecosystems of trust and transaction.

And then there's Node 1. Connected to 91 of the 110 people. Eighty-three percent of the entire organization runs through a single point. It's the sun that the rest of the network orbits around.

But here's what makes the structure interesting. The overall density is just 0.025. Out of all possible connections, only two and a half percent exist. This is a sparse network. It's not a broadcast system where everyone talks to everyone. It's built on trust. Selective, deliberate, need-to-know communication lines strung between people who have reason to talk to each other and no one else.

Sparse networks are hard to see. They're harder to break. Take out the wrong node and the network routes around the damage like water around a rock.

This is what the superhero is up against.

---

## The Superheroes

I built four of them. Four archetypes. Four different answers to: *how do you take down a network?*

**The Bruiser** goes straight for the top. Find the person with the most connections and take them out. Arrest the kingpin. Kick down the door of the most popular node in the graph. It's the obvious superhero move. The one you'd see in every movie.

**The Detective** is patient. She doesn't care who's loudest- she cares who's *load-bearing*. She maps the whole network, traces the communication lines, and finds the person whose removal isolates entire branches from each other. The bridge between factions. Take out the bridge and the rooms can't talk anymore.

**The Ghost** doesn't arrest anyone at all. No doors kicked down, no perp walks. The Ghost works in shadows- severing connections. Intercepted shipments. Planted misinformation. Sown paranoia. Two people who used to trust each other suddenly don't. The Ghost removes *edges*, not nodes.

**The Random** is what happens without a superhero. Random policing. An occasional bust with no strategy behind it. The control group.

My son looked at the four descriptions and immediately said The Ghost was coolest. "She's like a spy." I told him to hold that thought.

---

## Press Play

Same network. Same 110 people. Each archetype runs one operation at a time. After each operation I recalculate- because the network changes shape when you hurt it. Then I measure what's left: the size of the largest connected component. When that drops below 50% of the original, the network is functionally shattered. It can't coordinate. It can't move product. It's done.

I plotted all four dismantling curves on the same chart. Four lines, one graph. They start together. They don't stay together.

The Random barely moves. Thirty-seven operations before the network drops below 50%. You're pulling threads from a sweater and the sweater doesn't care.

The Bruiser does better. The line drops faster- five targeted operations and the network is broken in half.

But The Detective.

The Detective's line drops like a cliff. Each removal doesn't just take out one person- it severs the connection between entire factions. The left side of the network goes dark to the right side.

Four. That's all The Detective needs. Four operations to break a network of 110 people below the point where it can function.

Four people identified, four bridges burned, and the whole thing shatters into disconnected islands that can't coordinate, can't communicate, can't recover.

And The Ghost? My son's favorite? Even after 55 edge removals- cutting more connections than any other strategy by far- the network stays above 74% integrity. You can sever connection after connection and the people just find new ways to talk. The structure holds because the *nodes* are still there. People reroute.

So why does The Detective win? Betweenness centrality targets the *bridges*- not the busiest people, but the ones connecting subgroups to each other. Remove a bridge and you don't just lose one person. You lose the *pathway* between entire factions. A highly connected person inside a single cluster can be routed around. A bridge? There's no routing around a bridge that doesn't exist anymore.

---

## The Answer

So I come back to the kid.

The best superhero isn't the strongest. It's the smartest. The one who sees the structure nobody else can see. The one who knows that removing one quiet person in the middle matters more than taking down the loudest person at the top.

The Detective won by finding the bridges- the people who connect groups that otherwise wouldn't talk to each other. Not the bosses. Not the loud ones. The connectors. The people who look like nobody until you map the network and realize they're holding the whole thing together.

Four moves. Not forty. Not four hundred. Four.

The answer isn't about muscles or gadgets or capes. It's about seeing connections. Understanding structure. Finding the person who matters most- and knowing *why* they matter. That's a superpower. It's real. And it's learnable.

My son asked me if he could be a superhero. I ran a simulation on a real crime network and tested every kind of hero I could build.

The answer is yes. Just not the kind he expected.

Or maybe exactly the kind.

---

*The network in this article is real- 110 members of a drug trafficking ring mapped from wiretaps during a two-year investigation (Project Caviar, 1994-1996). It has been published and studied in peer-reviewed criminology research. I set it in Richmond because that's where we live. The simulation was run in Python using networkx. The kid is real too. He still wants to be a superhero.*
