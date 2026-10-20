---
slug: final-m2-ops-which-lines-add-five
type: mcq
title: Which lines really add 5?
lesson: operators
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

Mona has 10 pounds of phone credit, stored in `int x = 10;`. She recharges 5 pounds. Each option is **one line** that comes right after `int x = 10;`, followed by `cout << x << endl;`. Every option compiles.

Which lines make the program print `15`? Pick **all** of them.

## Options

- [x] `x = x + 5;`
  Right: the right side is worked out first with the old value, 10 + 5 = 15, and then stored back in `x`.
- [x] `x += 5;`
  Right: `x += 5` is the short way to write `x = x + 5`. `x` becomes 15.
- [ ] `x =+ 5;`
  It prints `5`. The two symbols are in the wrong order: C++ reads this as `x = +5`, "store plus 5 in x". The old 10 is replaced, not added to. The short form is `+=`, with the `+` first.
- [ ] `x + 5;`
  It prints `10`. C++ works out 10 + 5, but nothing tells it to **store** the answer, so it is thrown away. Only `=` (or `+=`) changes a variable.
- [ ] `x == x + 5;`
  It prints `10`. `==` only **compares**: it asks "is 10 equal to 15?" and gets FALSE. Comparing never changes a variable.

## Hints

- Which options contain an assignment, `=` or `+=`, that stores a value in `x`?
- Read `=+ 5` very slowly. Which symbol comes first?

## Explanation

A variable only changes when a value is **stored** in it, and storing is the job of the assignment operator `=` (and its short forms such as `+=`). The right side is worked out first, then the result goes into the variable on the left.

- `x = x + 5;` and `x += 5;` both store 10 + 5 = 15 in `x`.
- `x =+ 5;` is a sneaky typing mistake. It compiles without any error, because C++ reads it as `x = +5`, which simply stores 5. The old credit is lost.
- `x + 5;` calculates 15 but never stores it. (With warnings on, g++ says the statement has no effect.)
- `x == x + 5;` is a comparison: it produces TRUE or FALSE and changes nothing.
