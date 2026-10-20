---
slug: final-m2-dowhile-which-rewrites-match
type: mcq
title: The same loop without do
lesson: do-while-and-choosing-a-loop
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

`n` is an `int` that already holds some whole number: it may be positive, 0 or negative. This `do-while` loop prints `n` and goes down in twos:

```cpp
do
{
    cout << n << " ";
    n -= 2;
}
while (n > 0);
```

Each option replaces the whole loop. Which options print **exactly the same** as the `do-while`, for **every** starting value of `n`? Pick **all** of them.

## Options

- [x] `cout << n << " "; n -= 2; while (n > 0) { cout << n << " "; n -= 2; }`
  Right: the body is written once before the loop, so it always runs at least once, just like the first pass of a `do-while`. After that, the `while` checks `n > 0` before each further pass, exactly where the `do-while` checks it.
- [x] `int again = 1; while (again == 1) { cout << n << " "; n -= 2; if (n <= 0) { again = 0; } }`
  Right: `again` starts at 1, so the first pass always runs. At the end of each pass, the `if` asks the opposite of `n > 0`; when `n` is 0 or less, `again` becomes 0 and the loop stops. That is the do-while's check, moved to the end of the body.
- [ ] `while (n > 0) { cout << n << " "; n -= 2; }`
  Different when `n` starts at 0 or less: this loop checks first, so it prints nothing, but the `do-while` always prints `n` once. For `n = 0` the `do-while` prints `0 ` and this prints nothing.
- [ ] `cout << n << " "; while (n > 0) { n -= 2; cout << n << " "; }`
  It prints one value too many: the update now comes before the print, so the value that ends the loop is printed too. For `n = 5` it prints `5 3 1 -1` instead of `5 3 1`.

## Hints

- What does the `do-while` print when `n` starts at 0? Check each option with 0, then with 5.
- In a `do-while`, the condition is checked at the **end** of every pass. Where is it checked in each option?

## Explanation

A `do-while` runs the body first and checks the condition after it, so the body always runs at least once. To get the same behavior with a `while`, the first pass must happen **without** a check.

- Writing the body once before a `while` does exactly that, and the `while` then checks before every **further** pass.
- A variable such as `again` that starts at 1 also forces the first pass. Checking `n <= 0` at the end of the body and setting `again` to 0 stops the loop at the same moment as `while (n > 0);`.
- A plain `while` checks first, so for a starting value of 0 or less it prints nothing. The two loops only differ for those values, which is why you must test them.
- Moving the update before the print changes **what** is printed: the last, failing value (−1 for `n = 5`) gets printed too.
