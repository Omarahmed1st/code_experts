---
slug: final-b-types-which-print-2-5
type: mcq
title: Where does the .5 get lost?
lesson: data-types
difficulty: hard
reserved: true
multiple: true
updated: 2026-10-10
---

## Question

Each snippet below is the body of a complete program (with `#include <iostream>` and `using namespace std;`). Which snippets print `2.5`? Pick **all** of them.

## Options

- [ ] `int a = 5; double b = a / 2; cout << b;`
  It prints `2`. `a / 2` is `int / int`, so the result is 2 **before** it is stored. The `double` box gets 2, not 2.5.
- [ ] `double a = 5; int b = a / 2; cout << b;`
  It prints `2`. The division `5.0 / 2` really gives 2.5, but storing it in the `int` box `b` cuts off the .5.
- [x] `int a = 5; double b = a; cout << b / 2;`
  It prints `2.5`. `b` is a `double` holding 5, so `b / 2` is a decimal division.
- [x] `int a = 5; cout << a / 2.0;`
  It prints `2.5`. `2.0` is a decimal number, so the division keeps the decimal part.

## Hints

- For each snippet, check two places: the types in the **division**, and the type of the box the result is **stored** in.
- The .5 is lost if the division is `int / int`, or if the result goes into an `int`.

## Explanation

The decimal part can be lost in two different places, and a snippet prints `2.5` only if it survives both:

1. **In the division.** When both values are `int`, C++ does whole-number division: `5 / 2` is 2. Storing that 2 in a `double` afterwards does not bring the .5 back (first snippet).
2. **In the storing.** An `int` box keeps only the whole part. Even if the division gives 2.5, `int b = …` keeps 2 (second snippet).

In the third snippet, `b` is a `double`, so `b / 2` is a decimal division and the result goes straight to `cout`. In the fourth, `2.0` is a decimal number, so `a / 2.0` is 2.5 even though `a` is an `int`.
