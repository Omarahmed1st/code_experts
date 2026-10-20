---
slug: final-m2-var-fix-meter-readings
type: correct_code
title: Two readings, one box
lesson: variables-named-boxes-in-memory
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

An electricity meter only counts up. The user types **last month's** reading, then **this month's** reading. The program should print how many units were used this month, and the cost at 2 pounds per unit. For `1250 1400` it should print `Used: 150` and `Cost: 300`, but it prints `Used: -1400` and `Cost: -2800`.

The program has **two** bugs. Find them and fix the program. Keep the two separate `cin` lines and the three variables as they are.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int lastMonth = 0;
    int thisMonth = 0;
    cin >> thisMonth;
    cin >> thisMonth;
    int used = lastMonth - thisMonth;
    cout << "Used: " << used << endl;
    cout << "Cost: " << used * 2 << endl;
    return 0;
}
```

## Expected behavior

The user types two whole numbers: last month's reading, then this month's reading (which is never smaller). The program prints `Used: ` and this month's reading minus last month's, then `Cost: ` and the units used times 2. For `1250 1400` it prints `Used: 150` and `Cost: 300`.

## Tests

### a normal month

```input
1250 1400
```

```output
Used: 150
Cost: 300
```

### nothing used

```input
900 900
```

```output
Used: 0
Cost: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int lastMonth = 0;
    int thisMonth = 0;
    cin >> lastMonth;
    cin >> thisMonth;
    int used = thisMonth - lastMonth;
    cout << "Used: " << used << endl;
    cout << "Cost: " << used * 2 << endl;
    return 0;
}
```

## Hints

- After line 8 runs, what is in `thisMonth`? What happened to the first number the user typed? What is still in `lastMonth`?
- The meter counts up, so the new reading is the bigger one. Which number should come first in the subtraction?

## Explanation

1. **Both readings go into the same box.** A variable holds **one** value at a time, and a new value replaces the old one. Line 7 stores 1250 in `thisMonth`, then line 8 stores 1400 in the **same** box, so the 1250 is gone, and `lastMonth` still holds its starting value 0. The first `cin` must read into `lastMonth`.
2. **The subtraction is backwards.** The meter only counts up, so this month's reading is the bigger number: units used = `thisMonth - lastMonth`. `lastMonth - thisMonth` gives a negative answer.

With only the first bug fixed, the program would print `Used: -150`; with only the second fixed, it would print `Used: 1400`. Each bug hides behind the other, so you need both fixes before the output is right.
