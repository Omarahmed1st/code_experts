---
slug: ops-trace-fan-comparisons
type: trace
title: Is it hotter than 30?
lesson: operators
difficulty: easy
updated: 2026-10-10
---

## Question

Trace the program by hand. Remember how `cout` prints TRUE and FALSE. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int temperature = 30;
    cout << (temperature > 30) << endl;
    cout << (temperature >= 30) << endl;
    temperature = temperature + 1;
    cout << (temperature > 30) << endl;
    cout << (temperature != 31) << endl;
    return 0;
}
```

## Answer

```output
0
1
1
0
```

## Hints

- Is 30 greater than 30? Is it greater than **or equal to** 30?
- After line 8, what is `temperature`?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `temperature` starts at 30 | temperature = 30 | |
| 6 | `30 > 30` is FALSE | temperature = 30 | 0\n |
| 7 | `30 >= 30` is TRUE | temperature = 30 | 1\n |
| 8 | `30 + 1` is stored back in `temperature` | temperature = 31 | |
| 9 | `31 > 30` is TRUE | temperature = 31 | 1\n |
| 10 | `31 != 31` is FALSE | temperature = 31 | 0\n |

## Explanation

Each comparison answers TRUE or FALSE, and `cout` prints TRUE as `1` and FALSE as `0`.

The first two lines show the difference between `>` and `>=`: 30 is **not** greater than 30, but it **is** greater than or equal to 30. Line 8 changes `temperature` to 31, so `31 > 30` is TRUE. Last, `!=` means "not equal to", and 31 is equal to 31, so `31 != 31` is FALSE.
