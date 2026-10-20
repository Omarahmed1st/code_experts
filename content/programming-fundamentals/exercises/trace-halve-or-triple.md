---
slug: trace-halve-or-triple
type: trace
title: Halve it or triple it
lesson: loops-with-decisions-and-debugging
difficulty: hard
updated: 2026-10-09
---

## Question

This loop has an `if` / `else` inside it. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 6;
    int steps = 0;
    while (n != 1)
    {
        if (n % 2 == 0)
        {
            n = n / 2;
        }
        else
        {
            n = 3 * n + 1;
        }
        steps++;
        cout << n << endl;
    }
    cout << "Steps: " << steps << endl;
    return 0;
}
```

## Answer

```output
3
10
5
16
8
4
2
1
Steps: 8
```

## Hints

- In each pass, first ask: is `n` even (`n % 2 == 0`)? Then change `n`, then print the **new** value.
- The loop stops when `n` becomes 1. Is 1 printed before the loop checks?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `n` starts at 6 | n = 6; steps = 0 | |
| 7 | `6 != 1` is true, so the body runs | n = 6; steps = 0 | |
| 11 | 6 is even: `n = 6 / 2` | n = 3; steps = 0 | |
| 18 | `steps++`, print n | n = 3; steps = 1 | 3\n |
| 15 | `3 != 1`; 3 is odd: `n = 3 * 3 + 1` | n = 10; steps = 1 | |
| 18 | `steps++`, print n | n = 10; steps = 2 | 10\n |
| 11 | `10 != 1`; 10 is even: `n = 10 / 2` | n = 5; steps = 2 | |
| 18 | `steps++`, print n | n = 5; steps = 3 | 5\n |
| 15 | `5 != 1`; 5 is odd: `n = 3 * 5 + 1` | n = 16; steps = 3 | |
| 18 | `steps++`, print n | n = 16; steps = 4 | 16\n |
| 11 | `16 != 1`; 16 is even: `n = 16 / 2` | n = 8; steps = 4 | |
| 18 | `steps++`, print n | n = 8; steps = 5 | 8\n |
| 11 | `8 != 1`; 8 is even: `n = 8 / 2` | n = 4; steps = 5 | |
| 18 | `steps++`, print n | n = 4; steps = 6 | 4\n |
| 11 | `4 != 1`; 4 is even: `n = 4 / 2` | n = 2; steps = 6 | |
| 18 | `steps++`, print n | n = 2; steps = 7 | 2\n |
| 11 | `2 != 1`; 2 is even: `n = 2 / 2` | n = 1; steps = 7 | |
| 18 | `steps++`, print n | n = 1; steps = 8 | 1\n |
| 7 | `1 != 1` is false, so the loop ends | n = 1; steps = 8 | |
| 20 | print the number of steps | n = 1; steps = 8 | Steps: 8\n |

## Explanation

The decision is **inside** the loop, so it is made again on every pass with the current value of `n`:

- even (`n % 2 == 0`): halve it, `n = n / 2`;
- odd: `n = 3 * n + 1`.

So `n` goes 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1. The `cout` comes **after** the change, so the starting 6 is never printed, but the final 1 is: it is printed inside the last pass, and only then does the check `1 != 1` stop the loop.

`steps` is a counter that goes up by 1 each pass. There are 8 printed numbers, so `steps` is 8.
