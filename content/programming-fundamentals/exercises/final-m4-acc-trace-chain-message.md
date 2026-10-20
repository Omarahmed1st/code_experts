---
slug: final-m4-acc-trace-chain-message
type: trace
title: A chain message spreads
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Mona sends a message to 2 friends. Each of them forwards it to 3 people, each of those to 4 people, and so on. `people` is how many new people get the message at each level, and `total` adds them up. Notice that `people` grows by **multiplying**, so it starts at 1, not 0. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int level = 1;
    int people = 1;
    int total = 0;
    while (people < 100)
    {
        level++;
        people = people * level;
        total = total + people;
        cout << people << endl;
    }
    cout << level << " " << total << endl;
    return 0;
}
```

## Answer

```output
2
6
24
120
5 152
```

## Hints

- In each pass, `level` goes up first, then `people` is multiplied by the **new** `level`, then `total` adds the new `people`.
- The condition `people < 100` is checked before each pass, not in the middle of one.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | level = 1; people = 1; total = 0 | |
| 8 | `1 < 100` TRUE | level = 1; people = 1; total = 0 | |
| 10 | level 2: 1 × 2, total 0 + 2 | level = 2; people = 2; total = 2 | 2\n |
| 8 | `2 < 100` TRUE | level = 2; people = 2; total = 2 | |
| 10 | level 3: 2 × 3, total 2 + 6 | level = 3; people = 6; total = 8 | 6\n |
| 8 | `6 < 100` TRUE | level = 3; people = 6; total = 8 | |
| 10 | level 4: 6 × 4, total 8 + 24 | level = 4; people = 24; total = 32 | 24\n |
| 8 | `24 < 100` TRUE | level = 4; people = 24; total = 32 | |
| 10 | level 5: 24 × 5, total 32 + 120 | level = 5; people = 120; total = 152 | 120\n |
| 8 | `120 < 100` FALSE, the loop ends | level = 5; people = 120; total = 152 | |
| 15 | print level and total | level = 5; total = 152 | 5 152\n |

## Explanation

This program has two accumulators that work differently:

- `people` is a **multiplying** accumulator. It must start at **1**, because multiplying by 1 changes nothing (just as adding 0 changes nothing). If it started at 0, it would stay 0 forever: 0 × anything is 0.
- `total` is an ordinary **adding** accumulator, so it starts at 0.

Each pass first moves `level` up, then multiplies: 1 × 2 = 2, 2 × 3 = 6, 6 × 4 = 24, 24 × 5 = 120. After each multiplication the new value is added to `total` (2, 8, 32, 152) and printed.

When `people` is 24, the check `24 < 100` is TRUE, so one more pass runs and `people` jumps to 120. Only the **next** check, `120 < 100`, is FALSE and ends the loop. So 120 is printed even though it is over 100. After the loop, `level` is 5 and `total` is 2 + 6 + 24 + 120 = 152.
