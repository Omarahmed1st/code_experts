---
slug: pseudo-three-steps-order
type: mcq
title: From problem to pseudocode in three steps
lesson: pseudocode-planning-before-code
difficulty: medium
updated: 2026-10-10
---

## Question

The lecture goes from a problem to pseudocode in three steps. Which list gives them in the right order?

## Options

- [x] Identify the variables → choose their data types → write the pseudocode
  Right: first decide which values you need, then what kind of data each one holds, then write the steps.
- [ ] Write the pseudocode → identify the variables → choose their data types
  Writing the steps first means writing them before you know which values you need.
- [ ] Choose the data types → identify the variables → write the pseudocode
  You can't choose a data type for a variable you haven't found yet.
- [ ] Write the C++ code → identify the variables → write the pseudocode
  Pseudocode is the plan, so it comes **before** the C++ code, not after it.

## Hints

- For the rectangle problem, the lecture first listed `length`, `width` and `area`. What did it do next?
- You need to know a variable exists before you can decide its type.

## Explanation

For the rectangle problem, the lecture worked like this:

1. **Identify the variables**: `length`, `width` and `area`.
2. **Choose the data types**: lengths can have decimals (2.5 m), so `float` is the safe choice for all three.
3. **Write the pseudocode**: read `length` and `width`, calculate `area ← length * width`, print `area`.

Each step needs the one before it, and the whole plan is ready before any C++ is written.
