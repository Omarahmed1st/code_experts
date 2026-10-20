---
slug: final-b-flow-same-decision
type: mcq
title: Pseudocode that matches the parking flowchart
lesson: flowcharts
difficulty: hard
reserved: true
multiple: true
updated: 2026-10-10
---

## Question

A car park charges cars that stay more than 2 hours. Its flowchart is:

**Start** (oval) → **Input hours** (parallelogram) → diamond **hours > 2?**
- **YES** exit → **Print "Pay"** (parallelogram)
- **NO** exit → **Print "Free"** (parallelogram)

Both paths then join and lead to **End** (oval). `hours` is always a **whole number**.

Which pseudocode gives **exactly the same output** as this flowchart for every whole number of hours? Pick **all** of them.

## Options

- [x] `INPUT hours`, then `IF hours <= 2 THEN PRINT "Free" ELSE PRINT "Pay" END IF`
  Same: it asks the opposite question and swaps the two paths. `hours <= 2` is TRUE exactly when `hours > 2` is FALSE.
- [x] `INPUT hours`, then `IF hours >= 3 THEN PRINT "Pay" ELSE PRINT "Free" END IF`
  Same: for whole numbers, "more than 2" means 3 or more. Both conditions are TRUE for 3, 4, 5… and FALSE for 2, 1, 0.
- [ ] `INPUT hours`, then `IF hours < 2 THEN PRINT "Free" ELSE PRINT "Pay" END IF`
  Different at the edge: for exactly 2 hours, `2 < 2` is FALSE, so it prints `Pay`. The flowchart prints `Free` for 2 hours.
- [ ] `INPUT hours`, then `IF hours > 2 THEN PRINT "Free" ELSE PRINT "Pay" END IF`
  The question is right, but the paths are swapped: the TRUE path (THEN) must be the diamond's YES exit, which prints `Pay`.

## Hints

- The diamond's YES exit becomes the `THEN` part; the NO exit becomes the `ELSE` part.
- Test every option with the edge values: 2 hours and 3 hours. What does the flowchart print for each?

## Explanation

Each flowchart shape becomes one pseudocode step: the parallelogram is `INPUT hours`, the diamond is the `IF`, its YES exit is the `THEN` path and its NO exit is the `ELSE` path. The flowchart prints `Pay` for 3 hours or more, and `Free` for 2 hours or less.

Two conditions can look different and still do the same job:

- `hours <= 2` is the exact opposite of `hours > 2`, so swapping the THEN and ELSE paths gives the same output.
- Because hours are whole numbers, there is nothing between 2 and 3, so `hours >= 3` is TRUE for exactly the same values as `hours > 2`.

The edge value 2 catches the wrong option: `hours < 2` is FALSE for 2, so that version charges a car the flowchart lets go for free. Swapping the paths of `hours > 2` is wrong for every value.
