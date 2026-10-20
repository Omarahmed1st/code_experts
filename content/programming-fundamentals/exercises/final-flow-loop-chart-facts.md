---
slug: final-flow-loop-chart-facts
type: mcq
title: Reading a loop flowchart
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: hard
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

Here is a flowchart, described shape by shape:

1. Oval: **Start**.
2. Rectangle: `count ← 0`.
3. Diamond: `count < 4?`
4. The YES exit goes down to the parallelogram `Print "Hi"`, then to the rectangle `count ← count + 1`, and then an arrow goes **back up to the diamond**.
5. The NO exit goes to the oval **End**.

Which statements are **true**? Pick **all** the true ones.

## Options

- [x] `Print "Hi"` runs 4 times.
  Right: `count` is 0, 1, 2 and 3 when the answer is YES. At 4 the answer is NO.
- [x] The diamond's question is answered 5 times.
  Right: 4 times YES (count 0 to 3) and 1 time NO (count 4). The last check is the one that stops the loop.
- [ ] The rectangle `count ← 0` runs again every time the arrow goes back up.
  The backward arrow goes to the diamond, not to the start. The initialization runs only once.
- [x] Without the rectangle `count ← count + 1`, the flowchart would never reach End.
  Right: `count` would stay 0, so `0 < 4` would always be YES. That is an infinite loop.

## Hints

- Make a small trace table with one column: the value of `count` each time the arrow reaches the diamond.
- Where does the backward arrow go: to Start, or to the diamond?

## Explanation

This flowchart is a loop with the three parts from the lecture: the **initialization** `count ← 0` (runs once), the **condition** `count < 4?` (checked before every pass) and the **update** `count ← count + 1` (after the body, every time).

`count` reaches the diamond as 0, 1, 2, 3 and 4. The first four answers are YES, so `"Hi"` is printed 4 times. The fifth answer, `4 < 4`, is NO, so the chart goes to End. That is 4 iterations but 5 checks, the same pattern as "a loop that runs 5 times checks its condition 6 times".

The backward arrow returns to the **diamond**, so the initialization never runs again. And without the update, `count` never changes, the answer is always YES, and End is never reached.
