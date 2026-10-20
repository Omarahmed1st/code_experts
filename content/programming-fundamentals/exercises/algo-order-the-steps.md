---
slug: algo-order-the-steps
type: mcq
title: Putting the average steps in order
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: medium
updated: 2026-10-10
---

## Question

These four steps of the "average of three numbers" algorithm are mixed up:

- **A.** Print AVERAGE.
- **B.** Read the three numbers N1, N2 and N3.
- **C.** Divide SUM by 3 and store the result in AVERAGE.
- **D.** Add the three numbers and store the result in SUM.

Between Start and End, which order is correct?

## Options

- [x] B, D, C, A
  Right: read the numbers, add them, divide the sum, then print the result.
- [ ] B, C, D, A
  Step C divides SUM, but SUM has no value yet. The sum must be worked out first.
- [ ] D, B, C, A
  Step D adds the three numbers before they have been read.
- [ ] B, D, A, C
  This prints AVERAGE before it has been calculated.

## Hints

- Input comes first, then processing, then output.
- Which step needs SUM to already have a value?

## Explanation

An algorithm is an **exact, ordered** list of steps, and the order matters. You can't use a value before it exists.

1. **B**: read N1, N2 and N3 (input).
2. **D**: SUM ← N1 + N2 + N3 (processing; needs the numbers).
3. **C**: AVERAGE ← SUM / 3 (processing; needs SUM).
4. **A**: print AVERAGE (output; needs AVERAGE).

This is the same order as the lecture's plain steps, flowchart and pseudocode: input, then processing, then output.
