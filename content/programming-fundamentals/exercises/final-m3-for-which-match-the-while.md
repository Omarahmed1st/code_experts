---
slug: final-m3-for-which-match-the-while
type: mcq
title: Rewriting a while loop as a for loop
lesson: for-loops
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A runner has 20 km left and runs 6 km a day. This `while` loop prints the distance left at the start of each day:

```cpp
int n = 20;
while (n > 0)
{
    cout << n << " ";
    n -= 6;
}
```

It prints `20 14 8 2 `. Which `for` loops print **exactly the same**? Pick **all** of them.

## Options

- [x] `for (int n = 20; n > 0; n -= 6) { cout << n << " "; }`
  Right: the initialization, condition and update of the `while` loop have simply moved into the header. It prints `20 14 8 2 `.
- [x] `for (int n = 20; n >= 2; n -= 6) { cout << n << " "; }`
  Right: `n` only ever takes the values 20, 14, 8, 2, −4. For these values, `n >= 2` and `n > 0` give the same answers: TRUE down to 2, FALSE at −4. So it prints the same.
- [ ] `for (int n = 20; n > 2; n -= 6) { cout << n << " "; }`
  It prints only `20 14 8 `. When `n` is 2, `2 > 2` is FALSE, so the last day is missed.
- [ ] `for (int n = 20; n < 0; n -= 6) { cout << n << " "; }`
  It prints nothing. The condition is checked **before** the first pass, and `20 < 0` is FALSE, so the body runs zero times. The condition says when to keep going, not when to stop.

## Hints

- List every value `n` takes in the `while` loop, including the one that stops it.
- For each `for` loop, check its condition against those values, starting with the very first check.

## Explanation

Any `while` loop with a counter can be written as a `for` loop by moving its three parts into the header: `for (initialization; condition; update)`.

In the original loop, `n` takes the values 20, 14, 8 and 2 (printed), then −4, where `n > 0` is FALSE.

- The first `for` loop is the direct translation, so it matches.
- The second one has a different condition, `n >= 2`, but it gives the same answer as `n > 0` for **every value `n` actually takes**, so the output is the same. Two loops can be equivalent without being written the same way.
- `n > 2` is FALSE when `n` is 2, so it stops one day early.
- `n < 0` is FALSE for the very first value, 20, so that loop never runs its body. A `for` loop, like a `while` loop, checks its condition before every pass, the first one included.
