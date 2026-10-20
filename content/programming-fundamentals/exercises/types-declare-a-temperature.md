---
slug: types-declare-a-temperature
type: mcq
title: The right type for a temperature
lesson: data-types
difficulty: easy
updated: 2026-10-10
---

## Question

A sensor reads the temperature in a classroom: 31.6 degrees. Which declaration keeps this value **exactly**, decimal part included?

## Options

- [ ] `int temperature = 31.6;`
  An `int` holds whole numbers only. C++ drops the `.6` without asking, so the box holds 31.
- [x] `float temperature = 31.6;`
  Right: a `float` holds decimal numbers, so 31.6 is kept with its decimal part.
- [ ] `char temperature = 31.6;`
  A `char` holds a single character, such as `'A'`. It is the wrong kind of box for a measurement.
- [ ] `bool temperature = 31.6;`
  A `bool` holds only `true` or `false`. It can't hold a number such as 31.6.

## Hints

- Does the value have a decimal point?
- Which type did the lecture use for decimal numbers?

## Explanation

Ask the lecture's questions in order. Is 31.6 a whole number? No. Does it have a decimal point? Yes, so the type is `float` (or `double`, which is more precise).

The other boxes are the wrong kind. An `int` silently loses the `.6`, as in the lecture's `int temperature = 32.5;` mistake, which printed 32. A `char` is for one character and a `bool` is for true or false only.
