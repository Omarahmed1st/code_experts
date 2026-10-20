---
slug: final-m2-var-which-start-both-at-zero
type: mcq
title: Two boxes on one line
lesson: variables-named-boxes-in-memory
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A program counts metro trips in `count` and adds up their cost in `total`. Both boxes must hold **0** before the counting starts. Each option is the declaration line, followed by `cout << count << " " << total << endl;`.

Which options **compile** and are sure to print `0 0`? Pick **all** of them.

## Options

- [x] `int count = 0, total = 0;`
  Right: one line can declare several variables, separated by commas, and each one gets its own `= 0`.
- [x] `int count = 0; int total = count;`
  Right: `count` gets 0 first. Then the value inside `count`, 0, is copied into `total`.
- [x] `int count = 0, total = count;`
  Right: the names are created from left to right, so `count` already holds 0 when `total = count` copies it.
- [ ] `int count, total = 0;`
  Not sure to print `0 0`: the `= 0` belongs only to `total`. `count` is declared with **no** value, so what it holds is unpredictable. (With warnings on, g++ says `count` is used uninitialized.)
- [ ] `int count = total = 0;`
  It doesn't compile: `total` is used before it has been declared. Here only `count` is being declared, so `total` doesn't exist yet.

## Hints

- In a declaration with commas, each name is separate. Which names have their **own** `= 0`?
- A name can only be used after it has been declared. Is `total` declared before it is used?

## Explanation

A declaration such as `int count = 0, total = 0;` creates two boxes on one line. Each value belongs **only** to the name right before it.

- `int count = 0, total = 0;` gives both boxes 0.
- `int count = 0; int total = count;` and `int count = 0, total = count;` both create `count` first with 0, then copy that value into `total`. Copying a value is fine as long as the box already has one.
- `int count, total = 0;` looks as if it sets both, but `count` has no `= 0` of its own. A box that was never given a value holds whatever happened to be in that memory, so the program might print `0 0` once and `32764 0` the next time. This is why counters and accumulators must always be given a starting value.
- `int count = total = 0;` uses the name `total` before any box called `total` exists, so the compiler refuses it.
