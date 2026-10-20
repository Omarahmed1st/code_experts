---
slug: final-m3-solve-fix-juice-cost-unused
type: correct_code
title: The cost that was never used
lesson: from-problem-to-program
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

**Problem:** a cup of juice costs 15 pounds. Read the money a student has and the number of cups they want. If the cups cost **more** than the money, print `Not enough money`. Otherwise, print the change.

- **Input:** `money`, `cups`
- **Processing:** `cost = cups * 15`, then compare `cost` with `money`
- **Output:** `Not enough money`, or `Change: ` and the money left

The student tested the program with `50 3`. The cost is 45, so the expected output is `Change: 5`, but the program printed `Change: 47`. The processing line is right, but the rest of the program doesn't use its result. There are **two** bugs. Find them and fix the program. Keep line 7, `int cost = cups * 15;`.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (cups > money)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cups << endl;
    }
    return 0;
}
```

## Expected behavior

The user types the money and the number of cups (whole numbers). If `cups * 15` is more than the money, the program prints `Not enough money`. Otherwise it prints `Change: ` followed by the money minus the cost. For `50 3` it prints `Change: 5`.

## Tests

### enough money

```input
50 3
```

```output
Change: 5
```

### not enough money

```input
40 3
```

```output
Not enough money
```

### exactly enough

```input
45 3
```

```output
Change: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (cost > money)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cost << endl;
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
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (money < cost)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cost << endl;
    }
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (cups * 15 > money)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cups * 15 << endl;
    }
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (cost > money)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cups * 15 << endl;
    }
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money, cups;
    cin >> money >> cups;
    int cost = cups * 15;
    if (cups * 15 > money)
    {
        cout << "Not enough money" << endl;
    }
    else
    {
        cout << "Change: " << money - cost << endl;
    }
    return 0;
}
```

## Hints

- Write down the input, the processing and the output. Which value must be compared with the money: the number of cups, or what they cost?
- The test `50 3` printed 47. Which subtraction gives 50 − 3?

## Explanation

The plan says the processing is `cost = cups * 15`, and line 7 does that correctly. But the next lines go back to the **input** `cups` instead of using the processed value `cost`:

1. **The decision** compares `cups > money`, the number of cups with the money (3 > 50). It must compare the **cost**: `cost > money`. With the bug, `40 3` prints a change instead of `Not enough money`, because 3 is not more than 40.
2. **The change** is `money - cups` (50 − 3 = 47). It must be `money - cost` (50 − 45 = 5).

This is why we test with values we can work out by hand: we expected 5, saw 47, and that pointed us to the line that subtracted the wrong value. The test `45 3` checks the boundary: 45 is not **more** than 45, so the student has exactly enough and gets `Change: 0`.
