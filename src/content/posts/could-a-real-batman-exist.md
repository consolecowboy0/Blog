---
title: "I Want to Be Batman. So I Did the Math."
date: "2026-06-02"
description: "A 38-year-old with a Subaru sets out to prove you can become Batman. The hypothesis: the secret ingredient is not muscles or money, it is fear. What follows is charts, formulas, and the one number that ruins everything."
draft: false
---

<style>
.bat-formula{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:1.02rem;line-height:1.7;
background:rgba(128,128,128,0.10);border-left:3px solid #c0392b;border-radius:4px;
padding:0.9rem 1.1rem;margin:1.4rem 0;overflow-x:auto;white-space:pre-wrap;}
.bat-formula .lbl{display:block;font-family:inherit;font-size:0.8rem;opacity:0.7;margin-top:0.5rem;border:0;}
</style>

I want to be Batman.

Not in the way an eight-year-old wants to be Batman. In the way a 38-year-old with a mortgage, a Subaru, and a slightly alarming amount of free time wants to be Batman. Which is to say: seriously enough to open a spreadsheet about it.

So I did. I set out to find whether a regular person, me, could actually become a superhero. Not look like one. Be one. Go out at night and make crime worse at being crime. And I started with a hypothesis, written down before I ran a single number, because that is how you keep yourself honest:

**The secret ingredient is not the muscles, the gadgets, or the money. It is fear.**

Batman does not work because he can bench a Buick. He works because every criminal in the city believes he might already be behind them. "Criminals are a superstitious, cowardly lot." That is not a character note. I think it is the entire engineering spec. So this whole piece is one long attempt to prove it: that fear is the active ingredient, and everything else is a costume.

Let me show my work.

## The setup

You cannot test this in Gotham, so I picked a real city, mine, Richmond, Virginia, and built a model on its real published crime numbers. Honest caveat up front: Richmond does not publish an incident feed, so I am modeling from the real annual counts, not scraped rows, and I label every number measured or assumed. The relevant one: about 216 robberies and 589 aggravated assaults a year, call it 805 street crimes a guy on a rooftop could even theoretically interrupt. About two a day, across sixty square miles.

To prove fear is the ingredient, I first have to kill every other candidate. So let us murder the obvious ones with arithmetic.

## Candidate 1: just punch crime (the fists)

The fantasy is a guy who shows up and stops the mugging. So how often can he even be there? It is pure geometry. A mugging lasts about two minutes. At a generous fifteen miles an hour through real streets, that buys him a reachable radius of:

<div class="bat-formula">R = v · t = 15 mph · (2 min / 60) = 0.5 miles
<span class="lbl">interception radius: how far he can get before it's over</span></div>

A half-mile diamond on a sixty-square-mile board. The fraction of the city he can reach at any instant is that little diamond over the whole thing:

<div class="bat-formula">p_reach = 2 · R² / A = 2 · (0.5)² / 60 ≈ 0.008
<span class="lbl">about eight tenths of one percent of the city is in range</span></div>

Multiply the crimes per night by the odds he is close enough and the odds he then wins:

<div class="bat-formula">E[crimes stopped / yr] = λ · p_reach · p_win · 365 ≈ 2
<span class="lbl">λ = interruptible crimes/night, p_win = 0.5. Result: two. Per year.</span></div>

<img class="chart-img" src="/images/charts/badassman-reach-thimble.svg" alt="Scale map of Richmond with a tiny half-mile interception diamond around one patrolling vigilante; the reach covers under one percent of the city." loading="lazy" />

Two crimes a year. He is a thimble bailing the ocean, and the ocean is not even rough. Candidate one is dead, and it died of geometry, not weakness. One body can be in one place, and one place is never where the crime is. **Punching is not the ingredient.**

## Candidate 2: be smart about it (still attrition)

Fine, you say, he is the world's greatest detective, not the world's greatest jogger. So be smart. There are exactly two smart versions, and criminologists have measured both.

Target the right *places.* Crime clumps on the same corners. Park on the worst one and crime there drops about twenty-four percent (the firmest number in policing, sixty-five studies deep):

<div class="bat-formula">prevented_places = baseline_corner · 0.24 ≈ 12 to 48 / yr
<span class="lbl">at a corner running 50 to 200 crimes a year. Better. But it's one corner.</span></div>

Target the right *people.* A tiny number of offenders commit most of the crime (Wolfgang's Philadelphia study: 6% of the kids, 52% of the offenses, 82% of the robberies). Remove a handful and the leverage is huge:

<div class="bat-formula">prevented_people = N · λ_offender · (1 − r) ≈ 5 · 8 · 0.7 ≈ 30 / yr
<span class="lbl">N offenders removed, λ each, r = replacement rate</span></div>

<img class="chart-img" src="/images/charts/badassman-three-ways.svg" alt="Three ways to be Batman on a log scale: random patrol about two a year, camp the hot spots about five, remove the vital few about thirty." loading="lazy" />

Thirty a year is the first real number in this whole project. But read what "remove" requires: arrests, warrants, prosecution, follow-through. That is not a man in a mask, it is an institution. It already exists, it is called focused deterrence, and Boston used it to cut youth homicide 63%. So the smart versions are real, and neither is a vigilante's to do. **Being clever about attrition is not the ingredient either. It is a courthouse.**

## Candidate 3: money

Maybe Batman is just money. The famous figure for the gear is $682 million. But that is a Batcave, and I am not building a Batcave. Strip the billionaire out and a real kit is a $160 vest and about $1,600 all in, plus a gym membership. Now weigh it against the value a safety regulator puts on a human life ($13M):

<div class="bat-formula">cost_per_life = annual_cost / lives_saved ≈ $2,330 / 0.38 ≈ $6,100
   $6,100  ≪  $13,000,000   (VSL)
<span class="lbl">off by three orders of magnitude. Money is not the constraint. It never was.</span></div>

So money is ruled out. If anything, being a real-life hero is suspiciously cheap. **The constraint is something you cannot buy.** To find it, you have to make him fight. So I priced the fight.

## The fight loses money every time

Here is the part the movies sell, and it is the worst line item in the entire build.

<div class="bat-formula">E[net per fight] = p_win · H_averted  −  p_hurt · H_self  −  C_legal
                 ≈  (0.2 · 0.5)  −  (0.75 · 0.45)  −  0.12   <   0
<span class="lbl">in serious-injury-equivalents. Every intervention: about −$49,000.</span></div>

It is negative because the fights sort cruelly. The ones he can win are single, unarmed, and too small to matter. The ones that matter come with a gun (three of four aggravated assaults), a knife, or three guys, and those he loses, gets hurt in, or gets sued over. His skill and the stakes point in opposite directions. **So every physical candidate is dead.** Punching, patrolling, even winning, all net negative or near zero.

Which leaves exactly one thing standing. The hypothesis.

## The hypothesis, tested: fear

If fists, brains, and money are all ruled out, then either Batman is impossible, or the thing that makes him work was never any of them. It was the rumor. And a rumor has a property none of the above do. It scales.

One sniper does not clear a valley by shooting everyone in it. He shoots one, and a thousand men crawl for a week, because any of them could be next and none of them knows where he is. He occupies a hilltop the size of a towel and denies a square mile. That ratio is the whole thing:

<div class="bat-formula">fear_multiplier = area_denied / area_occupied
<span class="lbl">the sniper ratio. For fists it is ~1. For fear it is large.</span></div>

<div class="bat-formula">crimes_prevented = effect · (footprint · fear_multiplier) − credibility_cost
<span class="lbl">the deterrence model: fear lets one body cover a city it cannot patrol</span></div>

And it is measurable. London ran randomized fifteen-minute patrols in the Underground. Trouble dropped about a fifth, and ninety-seven percent of the drop happened while the police were not there. Read that as a multiplier:

<div class="bat-formula">fear_multiplier ≈ 1 / (1 − 0.97) ≈ 33×
<span class="lbl">denied time was ~33x the time anyone was actually present</span></div>

<img class="chart-img" src="/images/charts/badassman-two-channels.svg" alt="Log-scale bars: fists stop about two crimes a year, fear deters twelve to forty-eight at the measured floor, with an analogy ceiling of hundreds to thousands." loading="lazy" />

There it is. Deterrence beats the fists six to twenty-four times over at the measured floor, by a guy who stops no one. He just has to be a maybe. Certainty, not severity, is the active ingredient (you cannot threaten a harsher beating, you can only be more possibly-present), which is exactly the sniper. **Hypothesis supported.** Fear is the ingredient, and it is the only thing in this entire investigation that beats the geometry. I was right.

I should have stopped there. I felt good. Then I asked what it costs to keep the rumor true, and the good feeling did not survive.

## A sniper who never fires is just a guy on a hill

Fear is not a thing you buy once. It decays. A reputation nobody has watched act fades toward nothing in a week or two, the same way a decoy cop car works right up until everyone notices nobody is in it.

<div class="bat-formula">D(t) = D₀ · exp(−t / τ),   τ ≈ 1 to 2 weeks
<span class="lbl">deterrence decays exponentially without validation</span></div>

<img class="chart-img" src="/images/charts/badassman-decay-sawtooth.svg" alt="A sawtooth: deterrence spikes with each visible act then decays; frequent validation stays above the bite threshold, sparse validation falls below it." loading="lazy" />

So to keep the rumor alive he has to recharge it, faster than it decays, by doing the one thing that loses money and risks the bag: show up, be seen, and act, for real, on something dangerous. The fear is the engine. The brawls are the fuel. And the fuel is him.

## The one number that ruins everything

Put the validating cadence together with the fight odds and you get a survival curve. If he has to land a real, dangerous, witnessed act every couple of weeks to stay credible, and each one carries the fight's death risk:

<div class="bat-formula">P(alive after Y years) = (1 − p_death)^(rate · Y)

Y* = ln(0.5) / (rate · ln(1 − p_death)) ≈ 11 years
<span class="lbl">rate ≈ 20 acts/yr, p_death ≈ 0.3% per serious act. Y* = coin-flip-dead year.</span></div>

<img class="chart-img" src="/images/charts/badassman-legend-vs-man.svg" alt="Survival curves: the probability the hero is still alive craters over the years, while the deterrent he provides stays a flat, immortal line." loading="lazy" />

A coin flip he is dead inside eleven years. Get famous, get tested more, and it is five. Play it safe enough to live, and the rumor drops below the threshold where anyone is scared, and he is back to a guy in a costume stopping two crimes a year.

Meanwhile the deterrent itself, the twelve to forty-eight crimes a year that the fear prevents, does not age. It is worth the same in 1939 and 2026, no matter who is breathing inside the suit. Flat line. Immortal.

## The verdict

My hypothesis was right, and I wish it had been wrong.

Fear is the ingredient. It is the only thing that beats the geometry that kills every other version of Batman. The cowl, the theater, the working-in-the-dark, all of it is a machine for manufacturing the belief that he could be anywhere. That machine works.

It just runs on the man. The only way to keep the rumor true is to keep walking into the fights that kill him, and the math says they will. The geometry that doomed the fists never disappeared. It moved. It stopped being "how many crimes can one body stop" and became "how long does one body last keeping the legend scary." Criminals are a superstitious, cowardly lot, and that is precisely why Batman has to keep risking his life to stay frightening to them. The cowl outlives the guy in it. That is not tragic backstory. That is the load-bearing math.

So, can I be Batman? The Batman can exist. The fear is real, and it works. I just cannot survive being the guy who supplies it, and neither could anyone, which is probably why the ones in the comics never take the cowl off, never seem to age, and always, always look so tired.

I think I am going to keep the vest and skip the cowl.

Next: there is exactly one job left where the math says put the suit on anyway. It is not crime.
