---
slug: trace-countdown-by-twos
type: trace
title: Counting down in twos
lesson: while-loops-in-cpp
difficulty: easy
updated: 2026-10-09
---

## Question

Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 7;
    while (n > 0)
    {
        cout << n << endl;
        n -= 2;
    }
    cout << "Done" << endl;
    return 0;
}
```

## Answer

```output
7
5
3
1
Done
```

## Hints

- Write `n` in a column and update it after each print.
- The loop stops as soon as `n > 0` is false. What is `n` after 1?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `n` starts at 7 | n = 7 | |
| 6 | 7 > 0 is true, so the body runs | n = 7 | |
| 8 | print 7 | n = 7 | 7\n |
| 9 | `n -= 2` | n = 5 | |
| 8 | 5 > 0 is true: print 5 | n = 5 | 5\n |
| 9 | `n -= 2` | n = 3 | |
| 8 | 3 > 0 is true: print 3 | n = 3 | 3\n |
| 9 | `n -= 2` | n = 1 | |
| 8 | 1 > 0 is true: print 1 | n = 1 | 1\n |
| 9 | `n -= 2` | n = -1 | |
| 6 | -1 > 0 is false, so the loop ends | n = -1 | |
| 11 | print Done | n = -1 | Done\n |

## Explanation

`n -= 2` is short for `n = n - 2`, so `n` goes 7, 5, 3, 1, -1. The value -1 is never printed: the condition `n > 0` is checked **before** each pass, and it is false for -1. "Done" is printed once, after the loop.
