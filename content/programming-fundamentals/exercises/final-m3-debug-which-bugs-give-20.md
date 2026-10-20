---
slug: final-m3-debug-which-bugs-give-20
type: mcq
title: Which bug printed 20?
lesson: loops-with-decisions-and-debugging
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This loop should print the sum 1 + 2 + 3 + 4 + 5 = **15**:

```cpp
int sum = 0;
int i = 1;
while (i <= 5)
{
    sum += i;
    i++;
}
cout << sum << endl;
```

A student's version prints **20** instead. Their program is the one above with **one** change. Which of these changes could be the bug? Pick **all** the changes that make the program print exactly `20`.

## Options

- [x] `int sum = 5;` instead of `int sum = 0;`
  Right: the accumulator starts with 5 already in it, so the total is 5 + 15 = 20.
- [x] `i++;` moved **above** `sum += i;` inside the loop.
  Right: now `i` goes up before it is added, so the loop adds 2, 3, 4, 5 and 6: 2 + 3 + 4 + 5 + 6 = 20.
- [ ] `int i = 0;` instead of `int i = 1;`
  This runs one extra pass, but that pass adds 0, which changes nothing. It still prints 15, so it can't be the bug that printed 20.
- [ ] `while (i <= 6)` instead of `while (i <= 5)`
  This adds 6 as well: 15 + 6 = 21, not 20.

## Hints

- Trace each change with a small table: which values of `i` are added to `sum`?
- An accumulator must start at 0. What happens to the total when it doesn't?

## Explanation

When a loop gives the wrong total, trace which values are really added. Each change gives a different total:

| Change | Values added | Printed |
|---|---|---|
| `sum` starts at 5 | 1, 2, 3, 4, 5 (on top of 5) | 20 |
| `i++` before `sum += i` | 2, 3, 4, 5, 6 | 20 |
| `i` starts at 0 | 0, 1, 2, 3, 4, 5 | 15 |
| `i <= 6` | 1, 2, 3, 4, 5, 6 | 21 |

So two different bugs give exactly the same wrong answer, 20. That is why one test is not enough to find a bug: you have to trace the code to see which mistake it really is.

The change `int i = 0;` is an off-by-one error (six passes instead of five), but here it is invisible, because adding 0 changes nothing. It would show up in a loop that counts the passes or multiplies.
