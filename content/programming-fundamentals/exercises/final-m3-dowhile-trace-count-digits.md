---
slug: final-m3-dowhile-trace-count-digits
type: trace
title: How many digits does 0 have?
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A phone shop counts the digits of a code by removing the last digit with `n / 10` until nothing is left. The program counts the digits of 0 twice, once with a `do-while` and once with a `while`, and then counts the digits of 3050. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 0;
    int a = 0;
    do
    {
        a++;
        n = n / 10;
    }
    while (n > 0);
    n = 0;
    int b = 0;
    while (n > 0)
    {
        b++;
        n = n / 10;
    }
    cout << a << " " << b << endl;
    n = 3050;
    a = 0;
    do
    {
        a++;
        n = n / 10;
        cout << n << " ";
    }
    while (n > 0);
    cout << endl << a << endl;
    return 0;
}
```

## Answer

```output
1 0
305 30 3 0 
4
```

## Hints

- A `do-while` runs its body **before** it checks the condition. A `while` checks first.
- `n / 10` is int / int, so it removes the last digit: 3050 / 10 is 305.

## Explanation

**The first two loops, with n = 0.**

- The `do-while` runs its body first: `a` becomes 1 and `n` stays 0 (0 / 10 is 0). Only then is `0 > 0` checked; it is FALSE, so the loop stops after **one** pass. `a` is 1.
- The `while` loop checks `0 > 0` first. It is FALSE, so the body runs **zero** times and `b` stays 0.

So the first line is `1 0`. The number 0 is written with one digit, so here the `do-while` gives the right count and the `while` loop doesn't: counting digits is a job where the body must run at least once.

**The third loop, with n = 3050.** Each pass counts one digit, removes the last digit, and prints what is left:

| Pass | a | n after `n / 10` | `n > 0`? |
|---|---|---|---|
| 1 | 1 | 305 | TRUE |
| 2 | 2 | 30 | TRUE |
| 3 | 3 | 3 | TRUE |
| 4 | 4 | 0 | FALSE |

The second line is `305 30 3 0 ` (each number is followed by a space), and after the loop `endl` ends that line, so `4` is printed on its own line. The zeros inside 3050 are digits too, so they are counted.
