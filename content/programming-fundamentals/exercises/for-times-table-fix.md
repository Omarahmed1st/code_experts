---
slug: for-times-table-fix
type: correct_code
title: Fix the times table
lesson: for-loops
difficulty: medium
updated: 2026-10-10
---

## Question

This program should read a number `n` and print its times table from `n x 1` up to `n x 10`. For `3` it starts with `3 x 0 = 0` and stops at `3 x 9 = 27`. The loop header has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 0; i < 10; i++)
    {
        cout << n << " x " << i << " = " << n * i << endl;
    }
    return 0;
}
```

## Expected behavior

The user types a whole number `n`. The program prints exactly 10 lines, from `n x 1 = …` to `n x 10 = …`.

## Tests

### the table of 3

```input
3
```

```output
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
3 x 4 = 12
3 x 5 = 15
3 x 6 = 18
3 x 7 = 21
3 x 8 = 24
3 x 9 = 27
3 x 10 = 30
```

### the table of 7

```input
7
```

```output
7 x 1 = 7
7 x 2 = 14
7 x 3 = 21
7 x 4 = 28
7 x 5 = 35
7 x 6 = 42
7 x 7 = 49
7 x 8 = 56
7 x 9 = 63
7 x 10 = 70
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 1; i <= 10; i++)
    {
        cout << n << " x " << i << " = " << n * i << endl;
    }
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 1; i < 11; i++)
    {
        cout << n << " x " << i << " = " << n * i << endl;
    }
    return 0;
}
```

## Hints

- Write down the first and the last value of `i`. Which values should it take?
- With `i < 10`, is the line for 10 ever printed?

## Explanation

The loop must give `i` the values 1, 2, … 10. The broken header gives 0, 1, … 9 instead: that is still 10 lines, but the wrong ones.

1. **Wrong starting value.** `int i = 0` prints an extra line `3 x 0 = 0`. Start at 1.
2. **Wrong condition.** With `i < 10`, the check `10 < 10` is false, so the line for 10 is never printed. Use `i <= 10` (or `i < 11`).

Both are off-by-one errors. To find them, check the first pass and the last pass of the loop: the first line should be `n x 1` and the last `n x 10`.
