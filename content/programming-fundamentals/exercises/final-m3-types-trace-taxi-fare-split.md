---
slug: final-m3-types-trace-taxi-fare-split
type: trace
title: A taxi fare split four ways
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Four friends share a taxi. The fare and the tip are `double`, the number of riders is an `int`, and the currency letter is a `char`. Watch how `cout` prints each type, and which divisions keep their decimals. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    double fare = 22.50;
    double tip = 2.5;
    double total = fare + tip;
    int riders = 4;
    double each = total / riders;
    int whole = each;
    char unit = 'L';
    cout << fare << " + " << tip << " = " << total << endl;
    cout << each << unit << " " << whole << unit << endl;
    cout << riders / 8 << " " << riders / 8.0 << endl;
    return 0;
}
```

## Answer

```output
22.5 + 2.5 = 25
6.25L 6L
0 0.5
```

## Hints

- `cout` prints a `double` without extra zeros at the end: it does not print `22.50` or `25.0`.
- Line 10 stores a `double` in an `int` box. What happens to the decimal part?
- On line 14, look at the type of the number you divide by.

## Explanation

- Line 7: `total` is 22.5 + 2.5 = 25. `cout` prints a `double` as short as possible: `22.50` is printed as `22.5`, and 25.0 is printed as `25`, with no decimal point. The value is still a `double`.
- Line 9: `total / riders` is double / int, so the decimals stay: 25 / 4 = 6.25.
- Line 10: `whole` is an `int`, so storing 6.25 in it drops the `.25`: `whole` is 6.
- Line 13: the `char` `unit` is printed as the letter itself, right after the number, because nothing is printed in between: `6.25L`, then a space, then `6L`.
- Line 14: `riders / 8` is int / int, so it gives the whole part of 0.5, which is `0`. `riders / 8.0` divides by a decimal number, so the result keeps its decimal part: `0.5`.
