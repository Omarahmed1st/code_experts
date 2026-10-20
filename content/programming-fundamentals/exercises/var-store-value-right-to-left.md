---
slug: var-store-value-right-to-left
type: mcq
title: Storing 20 in a variable
lesson: variables-named-boxes-in-memory
difficulty: easy
updated: 2026-10-10
---

## Question

The variable `marks` is already declared as an `int`. Which C++ line **stores** the value 20 in `marks`?

## Options

- [x] `marks = 20;`
  Right: the value on the right (20) goes into the variable on the left (`marks`).
- [ ] `20 = marks;`
  This is backwards. The variable must be on the left of `=`. You can't store anything in the number 20.
- [ ] `marks == 20;`
  `==` compares two values. It asks "is marks equal to 20?" and does not change `marks`.
- [ ] `"marks" = 20;`
  `"marks"` in double quotes is just text, not the box called `marks`. Text can't receive a value.

## Hints

- In which direction does the value move in `x = 5;`?
- Which side of `=` must the name of the box be on?

## Explanation

In C++, `=` means **store**. Read it from right to left: the value on the right goes into the variable on the left. So `marks = 20;` puts 20 in the box called `marks`, and any old value in that box is replaced.

The pseudocode line `marks ← 20` means exactly the same thing; the arrow even shows the direction. `20 = marks;` has the direction wrong, `==` only compares, and `"marks"` in quotes is text, not a variable.
