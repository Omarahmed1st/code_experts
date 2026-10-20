---
slug: final-m2-if-trace-number-as-condition
type: trace
title: A number as the condition
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A fruit shop packs oranges in crates of 12. In this program the conditions are **calculations**, not comparisons. Remember the rule from the lecture: a value that is **not 0** counts as TRUE, and **0** counts as FALSE. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int oranges = 30;
    if (oranges % 12)
    {
        cout << "Left over: " << oranges % 12 << endl;
    }
    else
    {
        cout << "Full crates" << endl;
    }
    if (oranges / 40)
    {
        cout << "Big order" << endl;
    }
    else
    {
        cout << "Small order" << endl;
    }
    oranges = oranges + 6;
    if (oranges % 12)
    {
        cout << "Left over: " << oranges % 12 << endl;
    }
    else
    {
        cout << "Full crates" << endl;
    }
    if (oranges - 36)
    {
        cout << "Not 36" << endl;
    }
    else
    {
        cout << "Exactly 36" << endl;
    }
    return 0;
}
```

## Answer

```output
Left over: 6
Small order
Full crates
Exactly 36
```

## Hints

- Work out each condition as a number first. Is it 0 or not?
- `30 / 40` is int / int. What is its whole part?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `oranges` starts at 30 | oranges = 30 | |
| 6 | `30 % 12` is 6, not 0, so TRUE | oranges = 30 | |
| 8 | print the remainder | oranges = 30 | Left over: 6\n |
| 14 | `30 / 40` is 0, so FALSE | oranges = 30 | |
| 20 | the else path | oranges = 30 | Small order\n |
| 22 | `30 + 6` | oranges = 36 | |
| 23 | `36 % 12` is 0, so FALSE | oranges = 36 | |
| 29 | the else path | oranges = 36 | Full crates\n |
| 31 | `36 - 36` is 0, so FALSE | oranges = 36 | |
| 37 | the else path | oranges = 36 | Exactly 36\n |

## Explanation

An `if` needs TRUE or FALSE. When the condition is a number instead of a comparison, C++ treats **0 as FALSE** and **every other value as TRUE**.

- `30 % 12` is 6 (12 × 2 = 24, and 6 are left). 6 is not 0, so it is TRUE: the program prints `Left over: 6`.
- `30 / 40` is int / int, so it is 0. 0 is FALSE, so the `else` path prints `Small order`. This condition is TRUE only when there are at least 40 oranges.
- After adding 6, `oranges` is 36, and `36 % 12` is 0: FALSE, so `Full crates`.
- `36 - 36` is 0: FALSE, so `Exactly 36`. A condition like `oranges - 36` is TRUE for every value **except** 36, which is the opposite of what it seems to say.

Conditions written this way work, but they are hard to read. `oranges % 12 != 0` and `oranges != 36` say the same thing clearly, so prefer them in your own programs.
