---
slug: trace-doubling-pseudocode
type: trace
title: Doubling until the total reaches 20
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: medium
updated: 2026-10-09
---

## Question

Trace this pseudocode by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    x ← 1
    total ← 0
    WHILE total < 20 DO
        total ← total + x
        PRINT total
        x ← x * 2
    END WHILE
    PRINT x
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int x = 1;
    int total = 0;
    while (total < 20)
    {
        total = total + x;
        cout << total << endl;
        x = x * 2;
    }
    cout << x << endl;
    return 0;
}
```

## Answer

```output
1
3
7
15
31
32
```

## Hints

- Keep two columns, `x` and `total`. In each pass, `total` changes first, then it is printed, then `x` doubles.
- The condition is only checked at the top of the loop. Can `total` go past 20 before the check?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `x ← 1` | x = 1 | |
| 3 | `total ← 0` | x = 1; total = 0 | |
| 4 | `0 < 20` is TRUE, so the body runs | x = 1; total = 0 | |
| 5 | `total ← 0 + 1` | x = 1; total = 1 | |
| 6 | print total | x = 1; total = 1 | 1\n |
| 7 | `x ← 1 * 2` | x = 2; total = 1 | |
| 4 | `1 < 20` is TRUE | x = 2; total = 1 | |
| 5 | `total ← 1 + 2` | x = 2; total = 3 | |
| 6 | print total | x = 2; total = 3 | 3\n |
| 7 | `x ← 2 * 2` | x = 4; total = 3 | |
| 4 | `3 < 20` is TRUE | x = 4; total = 3 | |
| 5 | `total ← 3 + 4` | x = 4; total = 7 | |
| 6 | print total | x = 4; total = 7 | 7\n |
| 7 | `x ← 4 * 2` | x = 8; total = 7 | |
| 4 | `7 < 20` is TRUE | x = 8; total = 7 | |
| 5 | `total ← 7 + 8` | x = 8; total = 15 | |
| 6 | print total | x = 8; total = 15 | 15\n |
| 7 | `x ← 8 * 2` | x = 16; total = 15 | |
| 4 | `15 < 20` is TRUE | x = 16; total = 15 | |
| 5 | `total ← 15 + 16` | x = 16; total = 31 | |
| 6 | print total | x = 16; total = 31 | 31\n |
| 7 | `x ← 16 * 2` | x = 32; total = 31 | |
| 4 | `31 < 20` is FALSE, so the loop ends | x = 32; total = 31 | |
| 9 | print x | x = 32; total = 31 | 32\n |

## Explanation

Each pass does three things in order: add `x` to `total`, print `total`, then double `x`. So `x` goes 1, 2, 4, 8, 16, 32 and `total` goes 1, 3, 7, 15, 31.

The condition `total < 20` is checked only at the **top** of the loop. When `total` is 15, the check is TRUE, so one more full pass runs: `total` jumps to 31 (past 20), 31 is printed, and `x` doubles to 32. Only then does the check `31 < 20` fail.

After the loop, `PRINT x` prints the last value of `x`, which is 32, not 16.
