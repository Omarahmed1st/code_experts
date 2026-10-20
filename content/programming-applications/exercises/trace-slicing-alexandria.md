---
slug: trace-slicing-alexandria
type: trace
title: Slicing "Alexandria"
lesson: strings-indexing-and-slicing
difficulty: medium
updated: 2026-10-09
---

## Question

Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```python
city = "Alexandria"
print(len(city))
print(city[:4])
print(city[4:7])
print(city[-3:])
print(city[::3])
```

## Answer

```output
10
Alex
and
ria
Axda
```

## Hints

- Write the word with its indexes first: A is 0, l is 1, e is 2, … the last `a` is 9.
- In `city[start:stop]` the character at `stop` is **not** included.
- `::3` means "start at 0 and jump 3 places each time".

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | `city` holds 10 characters, indexes 0 to 9 | city = "Alexandria" | |
| 2 | `len(city)` counts the characters | city = "Alexandria" | 10\n |
| 3 | `city[:4]` takes indexes 0, 1, 2 and 3 | city = "Alexandria" | Alex\n |
| 4 | `city[4:7]` takes indexes 4, 5 and 6 | city = "Alexandria" | and\n |
| 5 | `city[-3:]` starts 3 from the end (index 7) and runs to the end | city = "Alexandria" | ria\n |
| 6 | `city[::3]` takes indexes 0, 3, 6 and 9 | city = "Alexandria" | Axda\n |

## Explanation

Here are the indexes of `"Alexandria"`:

| A | l | e | x | a | n | d | r | i | a |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |

- `city[:4]`: no start means index 0, and it stops **before** 4: `Alex`.
- `city[4:7]`: indexes 4, 5, 6: `and`.
- `city[-3:]`: -3 is the third character from the end (`r`, index 7), and no stop means "to the end": `ria`.
- `city[::3]`: every third character, starting at 0: indexes 0, 3, 6, 9 give `A`, `x`, `d`, `a`.
