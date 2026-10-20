---
slug: types-trace-where-decimals-go
type: trace
title: Where did the decimals go?
lesson: data-types
difficulty: hard
updated: 2026-10-10
---

## Question

Trace the program by hand. Watch the **type** of each variable. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int marks = 38.5;
    float average = 38.5;
    bool passed = false;
    cout << marks << endl;
    cout << average << endl;
    cout << marks / 4 << endl;
    cout << average / 4 << endl;
    cout << passed << endl;
    return 0;
}
```

## Answer

```output
38
38.5
9
9.625
0
```

## Hints

- What happens to `.5` when it is stored in an `int` box?
- `marks / 4` is `int / int`, but `average / 4` is `float / int`. Which one keeps the decimal part?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | 38.5 goes into an `int` box: the `.5` is dropped | marks = 38 | |
| 6 | 38.5 goes into a `float` box: kept as it is | marks = 38; average = 38.5 | |
| 7 | `passed` holds `false` | marks = 38; average = 38.5; passed = false | |
| 8 | print `marks` | marks = 38; average = 38.5; passed = false | 38\n |
| 9 | print `average` | marks = 38; average = 38.5; passed = false | 38.5\n |
| 10 | `38 / 4` is `int / int`: whole part only | marks = 38; average = 38.5; passed = false | 9\n |
| 11 | `38.5 / 4` is `float / int`: decimals kept | marks = 38; average = 38.5; passed = false | 9.625\n |
| 12 | `false` prints as 0 | marks = 38; average = 38.5; passed = false | 0\n |

## Explanation

Three rules from the lecture decide every line:

1. **A decimal stored in an `int` loses its decimal part.** `int marks = 38.5;` stores 38, so line 8 prints `38`. The `float` keeps 38.5.
2. **`int / int` gives a whole number.** `marks / 4` is `38 / 4`, which is 9 (4 × 9 = 36), and the rest is cut off. But `average / 4` is `float / int`, so the decimal part stays: 38.5 / 4 = 9.625.
3. **A `bool` prints as a number.** `false` is stored as 0, so line 12 prints `0`.
