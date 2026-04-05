---
title: "The One Number That Measures How Good You Are"
date: "2026-03-17"
description: "Every aspect of driving skill- braking, cornering, throttle, consistency- collapses into a single metric: how close you get to the edge."
draft: false
---

## The Edge

Here is a thing I cannot stop thinking about.

Every racing car, at every moment, has a limit. A boundary. The absolute maximum it can do given its tires, its aerodynamics, the weight pressing down on it, the asphalt underneath it. Cross that boundary and the car is no longer under your control. Stay too far inside it and someone else is going faster than you. The entire sport- every lap, every corner, every late-braking lunge into a hairpin at 280 km/h- comes down to one question.

How close can you get?

I've been calling this distance *epsilon*. The Greek letter engineers use for "a very small quantity." And I think epsilon might be the only number you need to measure how good a driver really is.

---

## What Epsilon Actually Is

Take any moment on a race track. The car has a performance envelope- the full budget of grip available for turning, braking, and accelerating. You've seen this drawn as a friction circle: the total grip the tires can deliver, split between lateral force (cornering) and longitudinal force (speeding up or slowing down). Use all of it for braking and you can't turn. Use all of it for cornering and you can't brake. The interesting stuff happens when you do both at once- trail braking into a corner, feeding in throttle on exit- and you're spending that grip budget in two dimensions simultaneously.

The edge of the friction circle is the limit. That's 100% of what the car can do.

Epsilon is the gap between that edge and where the driver actually operates.

You can write it simply. Let P_max be the maximum the car can deliver at a given instant. Let P_actual be what the driver extracts. Epsilon is the difference: *e = P_max - P_actual*. Normalize it and you get a skill ratio: *P_actual / P_max*. A perfect driver scores 1.0. An epsilon of zero. Every scrap of grip used, every meter of track, every millisecond of the lap at the absolute boundary of physics.

Nobody drives at 1.0. But the distance from it- that's the whole game.

---

## Everything Is Epsilon

Here is the part that made me sit up.

Every single thing people talk about when they talk about "driving skill" maps directly back to this one number. Every component. All of it.

Braking point accuracy? That's epsilon at the start of the braking zone- how close the driver gets to the latest possible moment to start slowing down without overshooting the corner. A late braker has a small epsilon. A cautious braker has a big one.

Corner entry speed? Epsilon at turn-in. How close to the maximum speed the car can carry into the arc without washing wide.

Throttle application on exit? Epsilon on the longitudinal axis- how early the driver gets on power without breaking traction.

Trail braking? That's the beautiful one. Trail braking is the art of braking *and* turning simultaneously, riding the edge of the friction circle through the transition from straight-line deceleration to cornering. A driver who trail-brakes well is tracing the boundary of the circle rather than jumping between the axes. Their epsilon stays small through the entire entry phase. Not just at one point- through the whole arc.

Consistency? That's epsilon variance. A consistent driver doesn't just have a small epsilon for one lap. They maintain it for sixty laps while the tires degrade, the fuel burns off, the track rubbers in, and someone is trying to pass them into Turn 3.

Wet weather skill? Same epsilon, smaller envelope. The limit shrinks in the rain. The friction circle contracts. A great wet-weather driver finds the new boundary faster than anyone else and operates just as close to it. Senna at Donington, 1993. The car was the same as everyone else's. The epsilon was not.

Racecraft? Epsilon under pressure, on a suboptimal line, while someone's front wing is six inches from your rear tire. The envelope doesn't change because you're wheel-to-wheel. But maintaining a small epsilon when your survival instincts are screaming at you to back off- that's a different kind of hard.

It all collapses. Every skill. Every attribute. Every thing a commentator has ever praised a driver for. It's all epsilon.

---

## The Hierarchy

So if epsilon is the metric, what does the hierarchy look like? I don't have telemetry from F1 teams (they are- to put it gently- not in the habit of sharing). But you can make reasonable estimates from the data that is available- lap time distributions, friction circle utilization studies, the publicly known gaps between drivers in identical machinery.

A novice road driver uses maybe 30 to 50 percent of available grip. Epsilon somewhere around 0.5 to 0.7. They're driving well inside the envelope and they don't even know the envelope exists. This is fine. This is safe. This is what you want on a public road.

An experienced track day driver gets that down to 0.1 to 0.2. They're approaching the limit in some corners, maybe finding it in one or two, backing off in the rest. They know the envelope is there. They've touched it. It scared them a little.

A professional GT or touring car driver lives at 0.03 to 0.05. Very close to the limit most of the time. Occasionally right on it.

An F1 driver- a midfield F1 driver, not a generational talent, just a *regular* twenty-best-in-the-world kind of driver- operates at 0.01 to 0.03. Within one to three percent of the absolute maximum the car can deliver. At 300 km/h. In traffic. For two hours. While the car's balance shifts underneath them every lap as the tires wear and the fuel load drops.

And then there's the other level. Senna. Schumacher. Hamilton. Verstappen. The ones who find performance in the third decimal place. Epsilon below 0.01. At or occasionally *beyond* the perceived limit- stepping over the edge and recovering, which is itself a form of even smaller epsilon because it means they understand the territory just past the boundary well enough to come back from it.

The whole spectrum of driving talent- from your commute to the greatest racing drivers who ever lived- is an epsilon hierarchy. Nothing else. Just: how close, how often, how reliably.

---

## The Envelope Moves

Here is the complication that makes this genuinely hard rather than merely difficult.

The performance envelope is not static. It changes constantly. Sometimes gradually, sometimes violently, sometimes mid-corner.

Tire degradation shrinks the envelope over a stint. The grip peak migrates. The thermal window shifts. What was the limit three laps ago is no longer the limit now, and a driver who doesn't recalibrate will either overdrive (crossing the new, smaller boundary) or underdrive (carrying a larger epsilon than necessary because they're still driving to the old limit).

Fuel load changes the car's mass and shifts its balance. The envelope reshapes- more responsive, different front-to-rear distribution, new limit in every corner.

Track evolution expands the envelope through a session as rubber lays down and the surface grips up. The limit moves outward. A driver who doesn't chase it leaves time on the table.

Weather can change everything mid-corner. A rain shower contracts the envelope instantly. A drying line creates a patchwork of different grip levels across the same piece of asphalt.

And then there's dirty air. Follow another car closely and you lose 30 to 50 percent of your aerodynamic downforce (in the pre-2022 cars- less now, but still significant). The envelope *contracts* suddenly on corner entry. The limit you had in clean air is gone. The car that was planted three seconds ago is now skating. Your epsilon just got a lot bigger- not because you did anything wrong, but because the physics changed underneath you.

A skilled driver's epsilon stays small even as the envelope shape-shifts beneath them. That's the real test. Not finding the limit in perfect conditions on an empty track with fresh tires and a full tank. Finding it when everything is moving.

Free practice sessions in F1 aren't just about learning the track. They're about mapping the envelope. Understanding its shape. Calibrating the internal model that lets the driver operate at the boundary when it counts.

---

## You Can Measure This

This isn't a metaphor. Teams measure epsilon in real time.

Modern telemetry records lateral and longitudinal g-forces at hundreds of samples per second. Steering angle, throttle position, brake pressure- all logged at millisecond resolution. Tire temperatures across the tread surface. Ride heights. Aerodynamic load estimates derived from speed, ride height, and known aero maps.

From all of this you can construct the instantaneous friction circle utilization. At every moment of every lap: what fraction of the available grip is the driver actually using? Plot it and you get a heat map of the g-g diagram- a two-dimensional picture where the axes are lateral and longitudinal acceleration and the boundary is the tire's grip limit.

A fully "filled" g-g diagram- color to the edges, dense and uniform- means the driver is using all the grip all the time. Low epsilon. A sparse diagram with gaps and thin spots means they're leaving grip on the table somewhere. The gaps tell you *where*. Under braking. On corner entry. Mid-corner. Exit.

This is why a telemetry engineer can tell a driver "you left two tenths in Turn 7" and *mean it precisely*. They can see the epsilon. They can measure the gap between what the car could do and what the driver did. They can overlay the driver's trace against the theoretical optimum and point to the exact moment where the driver backed off or lost the limit or simply wasn't close enough.

Even without proprietary team data, you can approximate epsilon. Lap time versus theoretical best (the sum of a driver's best sectors across different laps) measures aggregate epsilon. Speed trace comparisons show it continuously. Lap time variance measures consistency of epsilon. The tools exist. The data exists. The question is just- does anyone frame it this way?

---

## The Connection

There's a deeper thread here that I find genuinely beautiful. The performance envelope boundary is a phase transition.

On one side of the boundary: the car is under control. On the other side: it isn't. The driver operates in the neighborhood of a critical point. Epsilon is the distance to that critical point.

This connects to something I keep finding in completely unrelated domains. In network science, the algebraic connectivity of a graph measures how far the network is from fragmenting into disconnected pieces- distance to a structural phase transition. In the criminal network simulation I ran for [my son's superhero question](/posts/superhero-network), the 50% fragmentation threshold was a functional phase transition- the point where the network couldn't coordinate anymore. Same idea. Distance to the edge.

The best drivers are the ones who can live in the critical region. Close enough to the phase boundary to extract maximum performance. Controlled enough to avoid crossing into the chaotic regime. In complexity theory this is called "the edge of chaos"- the narrow band where information processing and adaptability are maximized. It's where interesting things happen.

It's also- and I didn't expect this when I started- a framework that works beyond racing. Rock climbing: how close are your moves to the hardest sequence you could execute? Surgery: how close to the limits of precision and speed? Music performance: how close to the physical limits of the instrument?

In every performance domain, skill is closeness to the edge of what's possible. The edge is defined by physics, biology, or mathematics. Not by convention. Not by opinion. By the hard boundaries of reality.

Epsilon is universal. It just happens to be most viscerally obvious when the consequences of crossing the boundary are a 200 mph shunt into a concrete wall.

---

## The Question That Won't Leave

So here is what I keep circling back to.

If epsilon is real- and I think it is- then we have a single dimensionless number that captures car handling skill across all conditions, all cars, all drivers. A number that works for a teenager in a Miata at a track day and for Max Verstappen in a Red Bull at Spa. A number that doesn't care whether the car is fast or slow, only whether the driver is extracting everything it has.

And that number is measurable. Right now. With telemetry that already exists.

So why don't we use it?

Partly because teams guard their data like state secrets (fair enough). Partly because the tyre models and vehicle dynamics models required to estimate the true limit are enormously complex. Partly because the racing world has always evaluated drivers by results- wins, championships, lap times- rather than by the efficiency of their grip utilization.

But imagine a world where you could see it. A broadcast overlay showing each driver's real-time epsilon. Not just who's fastest, but who's extracting the most from what they have. You'd see a midfield driver in a bad car operating at 99.2% and a frontrunner in a dominant car coasting at 97%. You'd see who's really driving and who's being carried.

That would change how we talk about racing. It would change how we argue about who the best driver is. It might even change who we think the best driver is.

One number. How close to the edge. That's the whole sport.

---

*This is a research piece exploring epsilon as a theoretical framework for measuring driving skill. The estimated epsilon values across skill levels are informed by publicly available friction circle utilization studies and professional driving instructor assessments, not proprietary F1 telemetry. The framework connects to ongoing research into phase transitions and critical thresholds- the same mathematical structures that appear in [network fragmentation](/posts/superhero-network) and [overtaking physics](/posts/f1-regs-broken). The edge is everywhere. You just have to know where to look.*
