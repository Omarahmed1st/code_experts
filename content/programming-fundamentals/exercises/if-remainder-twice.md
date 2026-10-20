---
slug: if-remainder-twice
type: trace
title: Two decisions with the remainder
lesson: decisions-if-then-else
difficulty: medium
updated: 2026-10-10
---

## Question

This program makes the same decision twice, with a different value of `x`. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int x = 17;
    int y = 4;
    if (x % y == 0)
    {
        cout << "divides" << endl;
    }
    else
    {
        cout << "remainder " << x % y << endl;
    }
    x = x + 3;
    if (x % y == 0)
    {
        cout << "divides" << endl;
    }
    else
    {
        cout << "remainder " << x % y << endl;
    }
    cout << "x is " << x << endl;
    return 0;
}
```

## Answer

```output
remainder 1
divides
x is 20
```

## Hints

- `17 % 4` is the remainder after dividing 17 by 4. How many whole 4s fit in 17, and what is left?
- Line 15 changes `x` before the second decision. Use the new value there.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `x` starts at 17 | x = 17 | |
| 6 | `y` starts at 4 | x = 17; y = 4 | |
| 7 | `17 % 4` is 1, and `1 == 0` is FALSE | x = 17; y = 4 | |
| 13 | the ELSE path prints the remainder | x = 17; y = 4 | remainder 1\n |
| 15 | `x = 17 + 3` | x = 20; y = 4 | |
| 16 | `20 % 4` is 0, and `0 == 0` is TRUE | x = 20; y = 4 | |
| 18 | the TRUE path runs | x = 20; y = 4 | divides\n |
| 24 | print the final value of `x` | x = 20; y = 4 | x is 20\n |

## Explanation

Each `if … else` chooses **one** of its two paths, and only that path runs.

- First decision: 4 fits into 17 four times (16), and 1 is left over. So `17 % 4` is 1, the condition `1 == 0` is FALSE, and the ELSE path prints `remainder 1`.
- Line 15 stores 20 in `x`.
- Second decision: `20 % 4` is 0 (4 fits exactly 5 times), so the condition is TRUE and `divides` is printed.

The two decisions look the same, but they give different results because the value of `x` changed between them. A condition always uses the value the variable has **at that moment**.
