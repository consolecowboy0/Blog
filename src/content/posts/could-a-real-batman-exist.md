---
title: "I Want to Be Batman. So I Did the Math."
date: "2026-06-02"
description: "A 38-year-old with a Subaru tests one idea: that the secret to being Batman is not muscles or money, it is fear. Charts, formulas, and the question that breaks the whole thing open."
draft: false
---

<style>
.katex-display { text-align: center; overflow-x: auto; overflow-y: hidden; padding: 0.2rem 0; }
</style>

I want to be Batman.

I am 38. I have a mortgage, a Subaru, and too much free time. I am not in shape, I am not rich, and I have never thrown a real punch. So on paper this is a stupid idea, and I opened a spreadsheet about it anyway. But I had a hunch, and the hunch is the only thing that lets the idea survive contact with reality.

Here is the hunch. The thing that makes Batman work is not the muscles, the gadgets, or the money. It is fear. "Criminals are a superstitious, cowardly lot." I do not think that is a character note, I think it is the engineering spec. So the test is not whether I can get strong or buy the right gear. It is one specific idea: could a regular person fight crime by being frightening, and would that actually move anything?

I went in skeptical of my own hunch. Here is where it held, and where it broke.

## Why a strong guy on patrol is hopeless

Start with the version that is just fit, not frightening: a guy who patrols and punches. The problem is geometry, and it is unforgiving.

A mugging takes about two minutes. At a generous fifteen miles an hour through real streets, that sets how far he can get before it is over:

$$
R = v \cdot t = 15\ \tfrac{\text{mi}}{\text{hr}} \times \tfrac{2}{60}\ \text{hr} = 0.5\ \text{mi}
$$

Half a mile of reach, on a city of sixty square miles. The slice he can cover at any instant is under one percent. Fold in the crimes per night, the odds he is close enough, and the odds he then wins, and the patrolling strongman stops about two crimes a year.

<img class="chart-img" src="/images/charts/badassman-reach-thimble.svg?v=2" alt="Scale map of Richmond with a tiny half-mile interception diamond around one patrolling vigilante; the reach covers under one percent of the city." loading="lazy" />

Two a year. He is a thimble bailing an ocean. One body can be in one place, and one place is almost never where the crime is. This is the thing the comics quietly understood: a real Batman cannot win by being everywhere, because he cannot be everywhere. If the idea works at all, it has to work through something that does not require him to physically be there. That is the whole appeal of fear. Fear scales. A body does not.

Fear might be the only door left. The question is whether it actually opens.

## Does fear actually scale?

The cleanest way I can describe the mechanism is a sniper. One sniper does not clear a valley by hitting everyone in it. He hits one person, and a thousand others crawl for a week, because any of them could be next and none of them knows where he is. He holds a hilltop the size of a towel and denies a square mile. That ratio, area believed over area held, is the whole idea. For a guy throwing punches it is about one. For a credible threat it can be enormous. So the right model is not crimes reached. It is the deterrent effect, spread across his footprint and multiplied by that ratio, minus what it costs to stay credible. I expected this to be where the hunch fell apart, vague fear-talk with no numbers under it. It mostly did not.

The firmest number in policing: a visible, credible presence on a hot spot drops crime there about twenty-four percent. On a corner running fifty to two hundred crimes a year, that is twelve to forty-eight prevented, against the two from punching. And the cleanest experiment we have, randomized fifteen-minute patrols in the London Underground, found that ninety-seven percent of the drop happened while no officer was actually present:

$$
m_{\text{fear}} \approx \frac{1}{1 - 0.97} \approx 33
$$

<img class="chart-img" src="/images/charts/badassman-two-channels.svg?v=2" alt="Log-scale bars: punching stops about two crimes a year; deterrence by presence prevents twelve to forty-eight at the measured floor, with a much larger but softer analogy ceiling." loading="lazy" />

The deterrent did roughly thirty times more work while absent than present. That is the sniper, measured. The mechanism is specific: it runs on the perceived certainty that someone might be watching, not on the threat of a worse beating. You cannot credibly promise a harder punch. You can only be more possibly-there. Which is, I think, exactly what a costume in the dark is for.

The floor, the twelve to forty-eight, is solid. The ceiling, a legend that terrifies a whole city, is an analogy I will not fake a number for. But the hunch held. Fear scales. A body does not. The hard part was never whether it works. It was what it costs to keep it true.

## The catch: a sniper who never fires is just a guy on a hill

Then I asked what it costs to keep the fear true.

Fear decays. A threat nobody has watched act fades toward nothing, the way a decoy police car deters right up until everyone notices it is empty:

$$
D(t) = D_0\, e^{-t/\tau}, \qquad \tau \approx 1\text{ to }2\ \text{weeks}
$$

<img class="chart-img" src="/images/charts/badassman-decay-sawtooth.svg?v=2" alt="A sawtooth: deterrence spikes with each visible act then decays; frequent validation stays above the threshold where it bites, sparse validation falls below it." loading="lazy" />

So to keep the rumor alive he has to recharge it, faster than it decays, by showing up and doing something real and dangerous. The gear is not what stops him. Stripped of the Batcave, the kit is a $160 vest and a gym membership, about $2,300 a year. Society prices a single life near $13 million. The gear is a rounding error. Money was never what stood in the way. He is.

Run those appearances through the odds of a real fight, every couple of weeks, and the number is brutal:

$$
P(\text{alive after } Y\text{ yr}) = (1 - p_d)^{\,r Y}, \qquad Y^\star = \frac{\ln 0.5}{\,r\,\ln(1 - p_d)\,} \approx 11
$$

<img class="chart-img" src="/images/charts/badassman-legend-vs-man.svg?v=2" alt="Survival curves: the probability the hero is still alive craters over the years, while the deterrent he provides stays a flat, ageless line." loading="lazy" />

Coin flip, he is dead in eleven years. The legend he built does not age a day. Remember that. It still was not the thing that stopped me, though. What stopped me was simpler, and I should have seen it from the start.

## He cannot do it at random

Look again at what "show up and do something real" has to mean. It cannot be punching strangers in alleys. A man who attacks people at random in the dark is not Batman, he is the reason you need a Batman. Random violence does not make you frightening to criminals specifically. It makes you frightening to everybody, which is both useless and a felony.

For the fear to land on the people it is supposed to land on, he has to hit the right ones, which means he has to know who they are. And crime cooperates here, because it is concentrated: a small share of people and places carry most of it. Wander at random and you stop about two a year. Camp the worst corners and it is maybe four. Take the few highest-rate offenders off the board and it is closer to thirty.

So the only version of this that is not insane is targeted. He watches crime during the day. He works out who is actually doing it. He builds something like a case. Then he goes out at night and spends the fear on the guilty, on purpose. He is not a brawler with a hunch. He is a detective with a grudge and a schedule. I kept writing it down, and it kept sounding less like a superpower and more like a shift.

And the moment I wrote that down, the whole thing turned over on me, because I had just described a job that already exists.

If the only Batman that works is a patient, intelligence-led operation that identifies specific offenders and builds cases against them before it ever throws a punch, then I have not designed a superhero. I have designed a worse, less accountable police department with one employee.

So here is the question I could not put back down, the one the rest of this is about:

**Why isn't he just a cop?**

## So when is he actually useful?

The honest answer is a bummer. Let me get the grim part over fast, then have some fun.

The grim part: in the ordinary case, a vigilante is just a worse cop. The system already catches shockingly little. Multiply the share of crimes even reported by the share the police then clear, and you land at about twenty-two percent of violent crime and seven percent of property crime ending in an arrest. Four in five violent crimes, nineteen in twenty property crimes: nobody is coming.

<img class="chart-img" src="/images/charts/badassman-clearance-funnel.svg?v=2" alt="Funnel: of 100 violent crimes about 47 are reported and 22 end in arrest; of 100 property crimes about 35 are reported and 7 end in arrest." loading="lazy" />

Enormous gap, great reason to put on a mask. Except finding the criminal was never the hard part. The thing that actually works, tracking the worst offenders and deterring them with the certainty of consequences, is called focused deterrence, and it is a five-step machine: find the offender, build admissible evidence, make a lawful arrest, get a prosecutor to threaten a real punishment, offer a way out. Our guy can do step one. The other four are the institution, and the fear only bites if a real consequence is standing behind it. He is one-fifth of a police department, and the expensive four-fifths is the part that matters.

And here is the real danger, the reason you do not want your neighbor doing this. Out in the normal world, he is *guessing.* He sees a guy who looks wrong, and acts. Guess about who is a criminal from a dark rooftop and sooner or later you have tackled a dad walking to his car. The entire apparatus of warrants and trials is just society's very expensive machine for not punching the wrong person.

So a real Batman, dropped into real crime, is a worse cop who occasionally maims an innocent. Cool. Cool cool cool.

## But now the fun part

Look at what is doing the damage in that story. Two things, and only two:

1. He is **not sure** the person is guilty, so he risks the innocent.
2. The system **could** have handled it, so he is just a less careful redundancy.

Now flip both. What if he is *certain*, and the system *cannot* act?

That is the entire Batman premise, and it turns out to be the one rigorous answer. Picture a villain, a Joker, who is not some stranger on a rooftop. Batman has caught him in the act eleven times. The odds that this specific, theatrical, monogrammed-calling-card lunatic is up to something are not a guess. They round to one:

$$
P(\text{guilty} \mid \text{it's the Joker}) \approx 0.999
$$

Round to one. That single number deletes the first problem. Vigilantes are dangerous because they might be wrong. That is the (1 − *p*) term, the chance you ruin someone innocent. Drive the prior to near-certainty and it collapses toward zero. You can act, hard, precisely because you are not guessing.

Now the second problem. In the comics the Joker does not walk because of bad luck. He walks because the system is *captured*: a bought DA, a terrified jury, an Arkham with a revolving door, one honest cop in a rotten building. The machine that turns guilt into consequence is jammed on purpose. Call the system's odds of actually acting *s*, and against a protected villain *s* is near zero. Weigh the harm of acting on a possible innocent against the harm of letting a known monster keep going:

$$
\underbrace{(1 - p)\,H_{\text{innocent}}}_{\text{risk of acting}} \;<\; \underbrace{p\,(1 - s)\,H_{\text{future harm}}}_{\text{cost of doing nothing}}
$$

Read it left to right. Push the prior *p* toward one and the left side, the cost of being wrong, goes to zero. Push the system's odds *s* toward zero and the right side, the harm nobody is preventing, goes to its maximum. The inequality is not close. It is a blowout. Acting is not merely defensible, it is the only sane move on the board.

Put those two dials on a chart and the whole question collapses into one little corner:

<img class="chart-img" src="/images/charts/badassman-joker-zone.svg?v=2" alt="A quadrant of prior certainty of guilt versus whether the justice system can act. Most squares say call the cops, hold a trial, or do not let an amateur guess. Only the corner with extraordinary certainty and a system that cannot act is the Batman Zone." loading="lazy" />

Almost everywhere on that map the answer is "call the police," or "hold a trial," or "for the love of god do not let an amateur guess." There is exactly one square where a masked man with no badge and no warrant is genuinely, uniquely the right tool: you are *certain*, and the law *cannot.* The Batman Zone.

And here is the part that made me laugh after all the spreadsheets. The comics have been parked in that corner the whole time. Batman almost never fights a guy he is unsure about. He fights the Joker, Two-Face, the Penguin, named recurring villains he has personally caught a dozen times, in a city written to be exactly corrupt enough that the courts can't hold them. The writers did not stumble into that. It is the only setup where the hero is justified, and a century of them found it by instinct.

## The verdict

Can a real Batman exist, and would he be any use? Against crime in general, no. The geometry says so, the law says so, and out here he is guessing. A real Batman fighting real crime is a bad and slightly horrifying idea.

But drop him into his actual job, a known villain he is genuinely sure of, in a system too captured to act, and he snaps into focus. Extraordinary certainty plus a broken courthouse is the one cell on the whole grid where the fear, the obsession, and the willingness to operate outside the system stop being liabilities and become the only thing that works.

Remember the eleven years. A man who keeps validating the fear is on a clock that kills him. But the Joker is not a patrol, he is a target. You do not need a decade against him. You need a handful of decisive acts before the odds catch up. The doomed career only pays for itself in this one corner.

Against a Joker, the body was never the point. The fear was. It scales. He does not.

There is just one catch, and it is the funniest result in the entire investigation. The spec was fear the whole time, and fear is useless until there is exactly one person worth being feared by. So to make a real Batman worth it, you do not need a better Batman.

You need a Joker.
