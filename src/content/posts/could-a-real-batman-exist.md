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

Not the way an eight-year-old does. The way a 38-year-old with a mortgage, a Subaru, and too much free time does: seriously enough to open a spreadsheet about it.

I am not in shape, I am not rich, and I have never thrown a real punch. So on paper this is a stupid idea. But I had a hunch, and I wanted to test it, because the hunch is the only thing that lets the idea survive contact with reality.

Here is the hunch. The thing that makes Batman work is not the muscles, the gadgets, or the money. It is fear. "Criminals are a superstitious, cowardly lot." I do not think that is a character note, I think it is the engineering spec. So this is not really a piece about whether I can get strong enough or buy the right gear. It is a test of one specific idea: could a regular person fight crime by being frightening, and would that actually move anything?

I went in skeptical of my own hunch. Here is where it held, and where it broke.

## Why a strong guy on patrol is hopeless

Start with the version that is just fit, not frightening: a guy who patrols and punches. The problem is geometry, and it is unforgiving.

A mugging takes about two minutes. At a generous fifteen miles an hour through real streets, that sets how far he can get before it is over:

$$
R = v \cdot t = 15\ \tfrac{\text{mi}}{\text{hr}} \times \tfrac{2}{60}\ \text{hr} = 0.5\ \text{mi}
$$

Half a mile of reach, on a city of sixty square miles. The fraction he can cover at any instant is tiny:

$$
p_{\text{reach}} = \frac{2R^2}{A} = \frac{2(0.5)^2}{60} \approx 0.008
$$

Put together the crimes per night, the odds he is close enough, and the odds he then wins:

$$
\mathbb{E}[\text{crimes stopped / yr}] = \lambda \cdot p_{\text{reach}} \cdot p_{\text{win}} \cdot 365 \approx 2
$$

<img class="chart-img" src="/images/charts/badassman-reach-thimble.svg" alt="Scale map of Richmond with a tiny half-mile interception diamond around one patrolling vigilante; the reach covers under one percent of the city." loading="lazy" />

Two a year. He is a thimble bailing an ocean. One body can be in one place, and one place is almost never where the crime is. This is the thing the comics quietly understood: a real Batman cannot win by being everywhere, because he cannot be everywhere. If the idea works at all, it has to work through something that does not require him to physically be there. That is the whole appeal of fear. Fear scales. A body does not.

So the hunch is not crazy. It might be the only door left. The question is whether it actually opens.

## Does fear actually scale?

The cleanest way I can describe the mechanism is a sniper. One sniper does not clear a valley by hitting everyone in it. He hits one person, and a thousand others crawl for a week, because any of them could be next and none of them knows where he is. He occupies a hilltop the size of a towel and denies a square mile. The ratio of those two areas is the entire idea:

$$
m_{\text{fear}} = \frac{\text{area denied by belief}}{\text{area actually occupied}}
$$

For a guy throwing punches, that ratio is about one. For a credible threat, it can be huge. So the right model for a fear-based crime-fighter is not "crimes reached," it is:

$$
\text{prevented} = e \cdot \big( A_{\text{footprint}} \cdot m_{\text{fear}} \big) \;-\; c_{\text{credibility}}
$$

where *e* is the deterrent effect and *c* is what it costs to stay credible. I expected this to be where my hunch fell apart, vague fear-talk with no numbers under it. It mostly did not.

The firmest number in policing: a visible, credible presence on a hot spot drops crime there about twenty-four percent. On a corner running fifty to two hundred crimes a year, that is twelve to forty-eight prevented, against the two from punching. And the cleanest experiment we have, randomized fifteen-minute patrols in the London Underground, found that ninety-seven percent of the drop happened while no officer was actually present:

$$
m_{\text{fear}} \approx \frac{1}{1 - 0.97} \approx 33
$$

<img class="chart-img" src="/images/charts/badassman-two-channels.svg" alt="Log-scale bars: punching stops about two crimes a year; deterrence by presence prevents twelve to forty-eight at the measured floor, with a much larger but softer analogy ceiling." loading="lazy" />

The deterrent did roughly thirty times more work while absent than present. That is the sniper, measured. And the mechanism is specific: it runs on the perceived certainty that someone might be watching, not on the threat of a worse beating. You cannot credibly promise a harder punch. You can only be more possibly-there. Which is, I think, exactly what a costume in the dark is for.

I want to be careful, because this is the easiest place in the whole piece to oversell. The floor, the six-to-twenty-four times, is measured and solid. The ceiling, the part where a legend terrifies a whole city, is an analogy I cannot put a real number on, so I will not. But the core of the hunch held: fear is the one thing that does more than a body can.

## The catch: a sniper who never fires is just a guy on a hill

Then I asked what it costs to keep the fear true, and the good mood passed.

Fear decays. A threat nobody has watched act fades toward nothing, the way a decoy police car deters right up until everyone notices it is empty:

$$
D(t) = D_0\, e^{-t/\tau}, \qquad \tau \approx 1\text{ to }2\ \text{weeks}
$$

<img class="chart-img" src="/images/charts/badassman-decay-sawtooth.svg" alt="A sawtooth: deterrence spikes with each visible act then decays; frequent validation stays above the threshold where it bites, sparse validation falls below it." loading="lazy" />

So to keep the rumor alive he has to recharge it, faster than it decays, by actually showing up and doing something real and dangerous. The gear is not what stops him. Stripped of the Batcave, the kit is a $160 vest and a gym membership, and against the value a safety agency puts on a life it is a rounding error:

$$
\frac{\text{cost}}{\text{life saved}} \approx \frac{\$2{,}330\,/\text{yr}}{0.38\ \text{lives}/\text{yr}} \approx \$6{,}100 \;\lll\; \$13\text{M (VSL)}
$$

Money was never the thing in the way. He is. Run those validating appearances through the odds of a real fight, every couple of weeks, and the survival math is grim:

$$
P(\text{alive after } Y\text{ yr}) = (1 - p_d)^{\,r Y}, \qquad Y^\star = \frac{\ln 0.5}{\,r\,\ln(1 - p_d)\,} \approx 11
$$

<img class="chart-img" src="/images/charts/badassman-legend-vs-man.svg" alt="Survival curves: the probability the hero is still alive craters over the years, while the deterrent he provides stays a flat, ageless line." loading="lazy" />

A coin flip he is dead inside eleven years, while the deterrent he provides does not age a day. That is a real cost, and I will come back to it. But it is not the thing that actually stopped me. The thing that stopped me was simpler, and I should have seen it at the start.

## He cannot do it at random

Look again at what "show up and do something real" has to mean. It cannot be punching strangers in alleys. A man who attacks people at random in the dark is not Batman, he is the reason you need a Batman. Random violence does not make you frightening to criminals specifically. It makes you frightening to everybody, which is both useless and a felony.

For the fear to land on the people it is supposed to land on, he has to hit the right ones, which means he has to know who they are. And crime cooperates here, because it is concentrated: a small share of people and places carry most of it.

$$
\text{prevented}_{\text{targeted}} = N \cdot \lambda_{\text{offender}} \cdot (1 - r)
$$

<img class="chart-img" src="/images/charts/badassman-three-ways.svg" alt="Log-scale comparison: random patrol prevents about two a year, camping the worst places about five, removing the few highest-rate offenders about thirty." loading="lazy" />

So the only version of this that is not insane is targeted. He watches crime during the day. He works out who is actually doing it. He builds something like a case. Then he goes out at night and spends the fear on the guilty, on purpose. He is not a brawler with a hunch. He is a detective with a grudge and a schedule.

And the moment I wrote that down, the whole thing turned over on me, because I had just described a job that already exists.

If the only Batman that works is a patient, intelligence-led operation that identifies specific offenders and builds cases against them before it ever throws a punch, then I have not designed a superhero. I have designed a worse, less accountable police department with one employee.

So here is the question I could not put back down, the one the rest of this is about:

**Why isn't he just a cop?**

## Part two: the badge and the cape

I sat with that question longer than I want to admit, because the honest answer kept getting worse for me.

Start with the case for the vigilante, which is real. The system catches shockingly little. Put together the share of crimes even reported and the share of reported crimes the police clear with an arrest:

$$
P(\text{arrest} \mid \text{crime}) = P(\text{reported}) \cdot P(\text{cleared} \mid \text{reported})
$$

The result is grim. Roughly twenty-two percent of violent crime and seven percent of property crime ever ends in an arrest. Put the other way: about four in five violent crimes, and nineteen in twenty property crimes, produce no arrest at all.

<img class="chart-img" src="/images/charts/badassman-clearance-funnel.svg" alt="Funnel: of 100 violent crimes about 47 are reported and 22 end in arrest; of 100 property crimes about 35 are reported and 7 end in arrest." loading="lazy" />

That is the gap a vigilante points at, and it is enormous: hundreds of thousands of violent crimes a year, millions of property crimes, no arrest, nobody coming. If you wanted a reason to put on a mask, it is right there in the data. So I went looking for what he could actually do with that gap, and that is where it fell apart, because finding the criminal turns out to be the easy part.

## Finding him is one step of five

What he wants to do, track offenders, target the worst, deter them with the certainty of getting caught, is not a fantasy. It exists, it works, and it has a name: focused deterrence. Boston's Operation Ceasefire is associated with a sixty-three percent drop in youth homicide. (Associated with. The evidence is strong but quasi-experimental, with no randomized trials, so I will not say caused.)

But look at how focused deterrence actually runs, and the problem with our hero jumps out.

<img class="chart-img" src="/images/charts/badassman-five-steps.svg" alt="Five boxes: find the offender (the only one a vigilante can do), then gather admissible evidence, make a lawful arrest, prosecute with a credible sanction, and provide an off-ramp, all of which require the institution." loading="lazy" />

It is a five-agency machine. Find the offender, build admissible evidence, make a lawful arrest, hand it to a prosecutor who can threaten a real and certain punishment, and open a way out on the other side. Our guy can do exactly one of those five steps. He can find the offender. He owns none of the four steps that turn a name into a consequence, and the fear only works if a credible, lawful consequence is actually standing behind it. A threat with nothing behind it is the empty decoy car again.

## His one real edge destroys itself

He does have a single genuine advantage over the police, and it is a strange one. A private citizen is not bound by the Fourth Amendment. Evidence he gathers, even in a way that would get a cop's case thrown out, is generally admissible (Burdeau v. McDowell, 1921). A detective would envy that.

It evaporates the moment he uses it. As soon as he coordinates with the police to actually get the guy off the street, the law treats him as an agent of the state (Skinner, 1989), and the Fourth Amendment snaps back. The edge and the goal are mutually exclusive: he can keep his admissible evidence, or he can have a partner who can make an arrest, but the instant he reaches for the second he loses the first. And a masked, anonymous man cannot stand up in court and authenticate anything anyway.

## The asymmetry that should scare you

Now the part that turned my stomach.

A police officer who makes a reasonable mistake of fact is protected. A private citizen who grabs someone for a felony that did not actually happen is strictly liable: false imprisonment, assault, sometimes kidnapping. Being reasonably wrong is not a defense for him. And his primary tool, the thing he builds the whole case on, is eyewitness identification, which is the single largest contributor to wrongful convictions, present in roughly seven of ten DNA exonerations.

So his method is the error-prone one, and his process strips out every safeguard built to catch the error. Even the formal system, with all of those safeguards running, gets it wrong. The most careful estimate we have, for death-row cases specifically, is that about four percent, one in twenty-five, of the condemned are likely innocent.

$$
P(\text{wrong person}) \;\gtrsim\; \underbrace{4\%}_{\substack{\text{careful system,}\\ \text{every safeguard on}}} \;\longrightarrow\; \text{higher with none}
$$

A faster, safeguard-free process does not beat that number. It raises it. His one true advantage over the police is the freedom to be catastrophically wrong about an innocent person, with nobody to answer to.

## So where does he actually belong?

There is a real niche. It is just nowhere near a dark alley.

It is investigation, and re-investigation, in the three places the institution genuinely fails: when it is itself the criminal (official misconduct appears in about fifty-four percent of all exonerations), when it has stopped looking (cold cases, where citizen-built genetic genealogy resolved more than six hundred by the end of 2023), and when it will not reopen a case that would indict it (roughly thirty-eight hundred exonerations since 1989). That is where an outside actor, free of the institution's blind spots and self-interest, genuinely matters.

But look at who fills that niche and actually wins. The Innocence Project. The genetic-genealogy labs. They are accountable nonprofits that cooperate with the police and borrow the police's own labs and databases. The moment the outsider succeeds, he has quietly turned back into an institution: accountable, cooperating, leaning on the exact tools he supposedly transcends. And when someone tries it the pure way, unaccountable and alone, you get the cautionary tale that haunts this whole question. The same unsupervised method that has freed innocent people has also coerced a false confession and sprung a guilty one. The autonomous version manufactures the precise error it claims to fix.

## The verdict

So, why isn't he just a cop?

Because being a cop is the only version that works. Strip the institution away and you do not get a faster, freer hero. You get a man who can find a suspect and then commit a crime against him, using the most error-prone method there is, with a higher chance of being wrong and nobody to stop him.

The fear was real. That part of the hunch held: a credible threat scales where a body cannot, and it is the only thing in this whole project that beats the geometry. But the operator who has to wield that fear, the one who tracks and targets and shows up at night, can only become useful by acquiring the exact things that make him the police: warrants, a lab, a prosecutor, an arrest, an oath, and somebody he answers to. The cape is a deterrent with no courthouse behind it, and a deterrent with nothing behind it eventually gets called.

So here is where I actually landed, a 38-year-old with a Subaru who started this wanting to be Batman. The honest version of that wish is not a vest and a bad night in an alley. It is a donation to the people who do the patient, accountable, institutional version of the work, and a gym membership, because the recomposition is genuinely good for me. It is a worse movie. I think it is the better answer.

Although. There is still one job left, the one where the math says put the suit on anyway. And it is not crime.
