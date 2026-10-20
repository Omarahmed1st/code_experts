---
slug: final-m4-types-trace-sharing-loaves
type: trace
title: When does the division become decimal?
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

7 loaves of baladi bread are shared between 2 people. Each line below mixes `int` values with the `double` values `1.0`, `2.0` and `0.9`. `*` and `/` are worked out **left to right**, and each step uses the types of its two values at that moment. Trace the program by hand. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int loaves = 7;
    int people = 2;
    double a = loaves / people * 1.0;
    double b = 1.0 * loaves / people;
    double c = loaves * 1.0 / people + loaves / people;
    int d = loaves / 2.0 + 0.9;
    bool more = b > a;
    cout << a << endl;
    cout << b << endl;
    cout << c << endl;
    cout << d << endl;
    cout << more << endl;
    return 0;
}
```

## Answer

```output
3
3.5
6.5
4
1
```

## Hints

- Line 7: which happens first, `loaves / people` or `* 1.0`? What are the types of the two values in that first step?
- Line 10: the right side really is 4.4, but look at the type of the box it is stored in.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | `7 / 2` is int / int = 3, then `3 * 1.0` = 3 | a = 3 | |
| 8 | `1.0 * 7` = 7.0, then `7.0 / 2` = 3.5 | a = 3; b = 3.5 | |
| 9 | `7 * 1.0 / 2` = 3.5, plus `7 / 2` = 3 | b = 3.5; c = 6.5 | |
| 10 | `7 / 2.0 + 0.9` = 4.4, stored in an `int` | c = 6.5; d = 4 | |
| 11 | `3.5 > 3` is TRUE | d = 4; more = true | |
| 12 | print a | a = 3 | 3\n |
| 13 | print b | b = 3.5 | 3.5\n |
| 14 | print c | c = 6.5 | 6.5\n |
| 15 | print d | d = 4 | 4\n |
| 16 | a `bool` prints as a number | more = true | 1\n |

## Explanation

A division keeps its decimal part only if at least one of its **two** values is a decimal number at the moment it is worked out. `*` and `/` go left to right, one step at a time:

- **Line 7:** the first step is `loaves / people`, which is `7 / 2` with two `int`s: 3. Multiplying by `1.0` afterwards is too late; the .5 is already gone. `a` is 3, and `cout` prints a whole-valued `double` without `.0`.
- **Line 8:** the first step is `1.0 * 7`, which is a decimal number (7.0). Then `7.0 / 2` is a decimal division: 3.5.
- **Line 9:** the left part works like line 8 and gives 3.5, but the right part, `loaves / people`, is int / int again: 3. So `c` is 3.5 + 3 = 6.5, not 7.
- **Line 10:** `7 / 2.0` is 3.5, and 3.5 + 0.9 = 4.4. But `d` is an `int`, so the decimal part is cut off: 4. C++ does not round, so 4.4 becomes 4 (and 4.9 would become 4 too).
- **Line 11:** `3.5 > 3` is TRUE, and `cout` prints a `bool` that is `true` as `1`.

The same three numbers gave three different answers on lines 7, 8 and 9. Only **where** the decimal value appears decides when the division keeps its .5.
