---
slug: final-b-ops-precedence-and-compare
type: trace
title: Calculate first, then compare
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Every line below needs the order of operations: `*` and `/` before `+` and `-`, brackets first, and a comparison only after both sides are calculated. Trace the program by hand. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 23;
    int b = 4;
    int c = a - b * 5;
    cout << c << endl;
    cout << (a - b) * 5 << endl;
    cout << a / b * b << endl;
    cout << (c * b > a - c) << endl;
    c = c + 7;
    cout << (c * b > a - c) << endl;
    return 0;
}
```

## Answer

```output
3
95
20
0
1
```

## Hints

- On line 7, which happens first: `a - b` or `b * 5`?
- On line 10, `a / b` is `int / int`. Work it out first, then multiply. On lines 11 and 13, calculate both sides before you compare.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `a` starts at 23 | a = 23 | |
| 6 | `b` starts at 4 | a = 23; b = 4 | |
| 7 | `b * 5` is 20 first, then `23 - 20` | a = 23; b = 4; c = 3 | |
| 8 | print c | a = 23; b = 4; c = 3 | 3\n |
| 9 | brackets first: `19 * 5` | a = 23; b = 4; c = 3 | 95\n |
| 10 | `23 / 4` is 5 (int), then `5 * 4` | a = 23; b = 4; c = 3 | 20\n |
| 11 | `12 > 20` is FALSE | a = 23; b = 4; c = 3 | 0\n |
| 12 | `c = 3 + 7` | a = 23; b = 4; c = 10 | |
| 13 | `40 > 13` is TRUE | a = 23; b = 4; c = 10 | 1\n |

## Explanation

C++ follows the maths order: brackets first, then `*` and `/`, then `+` and `-`. A comparison such as `>` is done **last**, after both of its sides have been calculated.

- Line 7: `b * 5` is 20, then `23 - 20 = 3`. The subtraction does not happen first.
- Line 9: the brackets change the order: `(23 - 4) * 5 = 19 * 5 = 95`.
- Line 10: `/` and `*` have the same rank, so they go left to right. `23 / 4` is `int / int`, which gives 5, and `5 * 4 = 20`. Dividing and then multiplying by the same number does not give 23 back, because the remainder 3 was thrown away.
- Line 11: `3 * 4 = 12` and `23 - 3 = 20`, so the question is `12 > 20`: FALSE, printed as `0`.
- Line 13: now `c` is 10, so it is `40 > 13`: TRUE, printed as `1`.
