---
slug: final-m4-dowhile-which-print-tens
type: mcq
title: Which do-while loops print 10 20 30?
lesson: do-while-and-choosing-a-loop
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

Each option is a complete `do-while` loop (with `#include <iostream>` and `using namespace std;` around it). Which loops print **exactly** `10 20 30 ` and nothing else? Pick **all** that do.

## Options

- [x] `int x = 10; do { cout << x << " "; x = x + 10; } while (x <= 30);`
  Right: it prints 10, 20 and 30. After printing 30, `x` becomes 40 and `40 <= 30` is FALSE.
- [x] `int x = 0; do { x = x + 10; cout << x << " "; } while (x < 30);`
  Right: `x` goes up **before** printing, so it prints 10, 20, 30. After printing 30, `30 < 30` is FALSE.
- [ ] `int x = 10; do { cout << x << " "; x = x + 10; } while (x < 30);`
  This prints only `10 20 `. After printing 20, `x` becomes 30 and `30 < 30` is FALSE, so 30 is never printed.
- [ ] `int x = 0; do { x = x + 10; cout << x << " "; } while (x <= 30);`
  This prints `10 20 30 40 `. After printing 30, `30 <= 30` is still TRUE, so it runs once more.
- [ ] `int x = 40; do { cout << x << " "; x = x + 10; } while (x <= 30);`
  This prints `40 `. A do-while always runs its body once before the first check, even when the condition is FALSE from the start.

## Hints

- Ask two questions for each loop: what is printed first, and what is `x` when the condition is checked after the last print?
- Does `x` go up before or after the `cout`?

## Explanation

Two things decide what a loop like this prints: **where the update is** (before or after the `cout`), and **the condition checked at the end of the pass**.

| Loop | Printed | Why it stops |
|---|---|---|
| print, then +10, `x <= 30` | 10 20 30 | x = 40 fails |
| +10, then print, `x < 30` | 10 20 30 | x = 30 fails |
| print, then +10, `x < 30` | 10 20 | x = 30 fails before 30 is printed |
| +10, then print, `x <= 30` | 10 20 30 40 | x = 40 fails only after 40 is printed |
| starts at 40 | 40 | a do-while runs once before checking |

So the same condition can be right in one loop and wrong in another: `x <= 30` is right when the update comes **after** the print, and `x < 30` is right when it comes **before**.
