---
slug: final-m3-while-trace-saver-and-spender
type: trace
title: Ali saves, Omar spends
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Ali has 2 pounds and saves 4 pounds a day. Omar has 30 pounds and spends 5 pounds a day. The loop runs while Ali has **less** than Omar, and both values change in every pass. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int ali = 2;
    int omar = 30;
    int days = 0;
    while (ali < omar)
    {
        ali += 4;
        omar -= 5;
        days++;
        cout << ali << " " << omar << endl;
    }
    cout << "Days: " << days << endl;
    cout << ali - omar << endl;
    return 0;
}
```

## Answer

```output
6 25
10 20
14 15
18 10
Days: 4
8
```

## Hints

- `ali += 4` means `ali = ali + 4`, and `omar -= 5` means `omar = omar - 5`.
- The `cout` inside the loop comes **after** the updates. The condition is checked again only at the start of the next pass.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | ali = 2; omar = 30; days = 0 | |
| 8 | `2 < 30` TRUE | ali = 2; omar = 30; days = 0 | |
| 10 | update both, count, print | ali = 6; omar = 25; days = 1 | 6 25\n |
| 8 | `6 < 25` TRUE | ali = 6; omar = 25; days = 1 | |
| 10 | update both, count, print | ali = 10; omar = 20; days = 2 | 10 20\n |
| 8 | `10 < 20` TRUE | ali = 10; omar = 20; days = 2 | |
| 10 | update both, count, print | ali = 14; omar = 15; days = 3 | 14 15\n |
| 8 | `14 < 15` TRUE | ali = 14; omar = 15; days = 3 | |
| 10 | update both, count, print | ali = 18; omar = 10; days = 4 | 18 10\n |
| 8 | `18 < 10` FALSE, the loop ends | ali = 18; omar = 10; days = 4 | |
| 15 | print days | days = 4 | Days: 4\n |
| 16 | 18 − 10 | ali = 18; omar = 10 | 8\n |

## Explanation

Each pass adds 4 to `ali`, takes 5 from `omar`, counts the day, and **then** prints the new values. So the first line is `6 25`, not `2 30`.

After three days Ali has 14 and Omar has 15: `14 < 15` is still TRUE, so there is a fourth pass. It prints `18 10`. Only at the next check is `18 < 10` FALSE, and the loop stops. The values passed each other inside the last pass, and the condition only notices at the next check, so Ali ends up 8 pounds **ahead**, not equal.

Both updates move the values toward making `ali < omar` FALSE, which is why the loop is guaranteed to stop.
