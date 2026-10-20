---
slug: final-b-var-swap-with-a-total
type: trace
title: Swapping two boxes with a total
lesson: variables-named-boxes-in-memory
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program uses a third variable, `total`, to change the values in `a` and `b`. Each assignment is worked out right to left, with the values the boxes hold **at that moment**. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 3;
    int b = 10;
    int total = a + b;
    a = total - a;
    b = total - a;
    cout << a << " " << b << endl;
    total = total + a;
    a = b;
    cout << a << " " << b << " " << total << endl;
    return 0;
}
```

## Answer

```output
10 3
3 3 23
```

## Hints

- After line 7, `total` is 13. On line 8, which value of `a` is used on the right side, and which value is stored?
- On line 9, `a` has already changed. Use its new value.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `a` starts at 3 | a = 3 | |
| 6 | `b` starts at 10 | a = 3; b = 10 | |
| 7 | `total = 3 + 10` | a = 3; b = 10; total = 13 | |
| 8 | `a = 13 - 3` | a = 10; b = 10; total = 13 | |
| 9 | `b = 13 - 10` (the new `a`) | a = 10; b = 3; total = 13 | |
| 10 | print a and b | a = 10; b = 3; total = 13 | 10 3\n |
| 11 | `total = 13 + 10` | a = 10; b = 3; total = 23 | |
| 12 | `a = b` copies 3 into `a`; the 10 is gone | a = 3; b = 3; total = 23 | |
| 13 | print a, b and total | a = 3; b = 3; total = 23 | 3 3 23\n |

## Explanation

An assignment works **right to left**: first the right side is calculated with the values the variables hold now, then the result replaces the old value of the variable on the left.

- Line 7 stores `3 + 10 = 13` in `total`.
- Line 8: `13 - 3 = 10` goes into `a`. The old 3 is gone.
- Line 9 uses the **new** `a`: `13 - 10 = 3` goes into `b`. So the values of `a` and `b` really were swapped: `10 3`.
- Line 11 uses the new `a` again: `13 + 10 = 23`.
- Line 12, `a = b`, copies the 3 from `b` into `a`. Now both boxes hold 3, and the 10 is lost, because a variable holds only one value at a time.
