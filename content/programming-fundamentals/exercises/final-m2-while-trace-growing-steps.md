---
slug: final-m2-while-trace-growing-steps
type: trace
title: Steps that keep growing
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A child walks along a corridor. The first jump is 1 metre, and every jump is 2 metres longer than the one before. The first loop uses `+=` twice; the second loop counts down with `--`. Trace the program by hand. What exactly does it print? Type one line of output per line (spaces at the end of a line don't matter).

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pos = 0;
    int step = 1;
    while (pos < 20)
    {
        pos += step;
        step += 2;
        cout << pos << " ";
    }
    cout << endl;
    cout << step << endl;
    while (step > pos / 3)
    {
        step--;
    }
    cout << step << endl;
    return 0;
}
```

## Answer

```output
1 4 9 16 25 
11
8
```

## Hints

- In each pass, `pos` grows by the **current** `step`, and only then does `step` grow by 2.
- In the second loop, `pos / 3` is int / int. Work it out once: does it change inside that loop?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | pos = 0; step = 1 | |
| 7 | `0 < 20` TRUE: pos + 1, step + 2, print | pos = 1; step = 3 | |
| 7 | `1 < 20` TRUE: pos + 3, step + 2, print | pos = 4; step = 5 | |
| 7 | `4 < 20` TRUE: pos + 5, step + 2, print | pos = 9; step = 7 | |
| 7 | `9 < 20` TRUE: pos + 7, step + 2, print | pos = 16; step = 9 | |
| 7 | `16 < 20` TRUE: pos + 9, step + 2, print | pos = 25; step = 11 | |
| 7 | `25 < 20` FALSE, the loop ends | pos = 25; step = 11 | |
| 13 | end the line | pos = 25; step = 11 | |
| 14 | print step | pos = 25; step = 11 | |
| 15 | `25 / 3` is 8; `11 > 8` TRUE, step-- | pos = 25; step = 10 | |
| 15 | `10 > 8` TRUE, step-- | pos = 25; step = 9 | |
| 15 | `9 > 8` TRUE, step-- | pos = 25; step = 8 | |
| 15 | `8 > 8` FALSE, the loop ends | pos = 25; step = 8 | |
| 19 | print step | pos = 25; step = 8 | |

## Explanation

In the first loop each pass adds the **current** step to `pos`, then makes the step 2 longer. So the jumps are 1, 3, 5, 7, 9, and the positions are 1, 4, 9, 16, 25 (the square numbers). Each is printed with a space after it, on one line.

The condition `pos < 20` is checked only at the **start** of a pass. At 16 it is still TRUE, so one more jump of 9 takes `pos` to 25, past 20, and 25 is printed. Then `25 < 20` is FALSE and the loop stops. By then `step` has grown five times: 1 + 5 × 2 = 11.

The second loop compares `step` with `pos / 3`. `pos` doesn't change inside this loop, and `25 / 3` is 8 (int / int). `step--` takes 11 down to 10, 9 and then 8. `8 > 8` is FALSE, so the loop stops and prints 8.
