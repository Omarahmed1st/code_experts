---
slug: final-while-trace-reverse-digits
type: trace
title: Turning a number around
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This `while` loop takes the digits of a number one at a time with `%` and `/`. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 4071;
    int reversed = 0;
    int digits = 0;
    int digit;
    while (n > 0)
    {
        digit = n % 10;
        reversed = reversed * 10 + digit;
        n = n / 10;
        digits++;
        cout << reversed << endl;
    }
    cout << "Digits: " << digits << endl;
    cout << "n: " << n << endl;
    return 0;
}
```

## Answer

```output
1
17
170
1704
Digits: 4
n: 0
```

## Hints

- `n % 10` is the last digit of `n`, and `n / 10` (int / int) removes the last digit. Try it with 4071 first.
- In `reversed * 10 + digit`, the multiplication happens before the addition. What happens in the pass where the digit is 0?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | n = 4071; reversed = 0; digits = 0 | |
| 9 | `4071 > 0` TRUE | n = 4071; reversed = 0; digits = 0 | |
| 11 | digit = 1; reversed = 0 * 10 + 1 | digit = 1; reversed = 1 | |
| 13 | n = 407; digits = 1; print | n = 407; reversed = 1; digits = 1 | 1\n |
| 9 | `407 > 0` TRUE | n = 407; reversed = 1; digits = 1 | |
| 11 | digit = 7; reversed = 1 * 10 + 7 | digit = 7; reversed = 17 | |
| 13 | n = 40; digits = 2; print | n = 40; reversed = 17; digits = 2 | 17\n |
| 9 | `40 > 0` TRUE | n = 40; reversed = 17; digits = 2 | |
| 11 | digit = 0; reversed = 17 * 10 + 0 | digit = 0; reversed = 170 | |
| 13 | n = 4; digits = 3; print | n = 4; reversed = 170; digits = 3 | 170\n |
| 9 | `4 > 0` TRUE | n = 4; reversed = 170; digits = 3 | |
| 11 | digit = 4; reversed = 170 * 10 + 4 | digit = 4; reversed = 1704 | |
| 13 | n = 0; digits = 4; print | n = 0; reversed = 1704; digits = 4 | 1704\n |
| 9 | `0 > 0` FALSE, the loop ends | n = 0; reversed = 1704; digits = 4 | |
| 17 | print digits | digits = 4 | Digits: 4\n |
| 18 | print n | n = 0 | n: 0\n |

## Explanation

In each pass, `n % 10` gives the last digit of `n` (the remainder after dividing by 10), and `n = n / 10` removes that digit, because int / int keeps only the whole part. So `n` goes 4071 → 407 → 40 → 4 → 0, and the digits come out in the order 1, 7, 0, 4.

`reversed = reversed * 10 + digit` moves the old digits one place to the left and adds the new digit at the end: 1, 17, 170, 1704. The 0 digit still counts: it turns 17 into 170.

The update `n = n / 10` moves `n` toward 0, so the condition `n > 0` eventually becomes FALSE and the loop stops after 4 passes. That is why `digits` is 4 and `n` is 0 after the loop.
