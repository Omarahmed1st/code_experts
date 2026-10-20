---
slug: debug-exactly-five-numbers
type: mcq
title: Which loops print exactly 1 to 5?
lesson: loops-with-decisions-and-debugging
difficulty: medium
multiple: true
updated: 2026-10-10
---

## Question

Each loop has `cout << i;` as its body. The goal is to print exactly `12345`. Which headers reach the goal? Pick **all** the correct ones.

## Options

- [x] `for (int i = 1; i <= 5; i++)`
  Right: `i` takes the values 1, 2, 3, 4 and 5. When `i` is 6, `6 <= 5` is false.
- [x] `for (int i = 1; i < 6; i++)`
  Right: `i < 6` stops at the same place as `i <= 5`, so it also prints 1 to 5.
- [ ] `for (int i = 1; i < 5; i++)`
  Wrong condition: `5 < 5` is false, so 5 is never printed. This prints `1234`, one too few.
- [ ] `for (int i = 0; i <= 5; i++)`
  Wrong starting value: 0 to 5 is six numbers. This prints `012345`, one too many.

## Hints

- For each header, write the first value and the last value of `i`.
- Test the last pass: is the condition true or false when `i` is 5?

## Explanation

Off-by-one errors come from two places: the **start value** and the choice between `<` and `<=`. Check the first pass and the last pass of each loop:

| Header | First `i` | Last `i` | Prints |
|---|---|---|---|
| `i = 1; i <= 5` | 1 | 5 | `12345` |
| `i = 1; i < 6` | 1 | 5 | `12345` |
| `i = 1; i < 5` | 1 | 4 | `1234` |
| `i = 0; i <= 5` | 0 | 5 | `012345` |

For whole numbers, `i <= 5` and `i < 6` mean the same thing. `i <= 5` is usually clearer, because the 5 you want appears in the code.
