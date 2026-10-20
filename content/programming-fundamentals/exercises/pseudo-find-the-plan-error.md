---
slug: pseudo-find-the-plan-error
type: mcq
title: What is wrong with this plan?
lesson: pseudocode-planning-before-code
difficulty: medium
updated: 2026-10-10
---

## Question

This pseudocode should read the length and width of a rectangle and print its area. What is wrong with it?

## Code

```pseudocode
BEGIN
    INPUT length
    area ← length * width
    INPUT width
    PRINT area
END
```

## Options

- [ ] `INPUT` should be written as `cin`.
  Pseudocode uses the keyword `INPUT`. `cin` is the C++ form, used only when you turn the plan into code.
- [ ] Pseudocode can't read two values, so `width` must be a fixed number.
  You can use as many `INPUT` lines as you need. The rectangle example in the lecture uses two.
- [x] `width` is used in the calculation before it has been read.
  Right: the steps run in order, so `INPUT width` must come before `area ← length * width`.
- [ ] `PRINT area` should come before the calculation.
  You can't print the area before it has been calculated. Output comes last.

## Hints

- The steps run from top to bottom. When line 3 runs, which values do we already have?
- Remember the template: input, then process, then output.

## Explanation

Almost every simple algorithm follows the template **input → process → output**, between `BEGIN` and `END`. Here the processing line `area ← length * width` comes before `INPUT width`, so it uses `width` before the program knows its value.

The fix is to move `INPUT width` up, so both inputs are read first:

```pseudocode
BEGIN
    INPUT length
    INPUT width
    area ← length * width
    PRINT area
END
```

Pseudocode is where you catch logic mistakes like this one, before you write any code.
