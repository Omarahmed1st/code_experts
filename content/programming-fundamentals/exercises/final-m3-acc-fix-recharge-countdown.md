---
slug: final-m3-acc-fix-recharge-countdown
type: correct_code
title: Fix the phone recharge countdown
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Hana recharged her phone **4** times this month. Recharges can have piastres, such as 12.5 pounds. This program reads the 4 amounts, counting **down** the recharges that are still to be read in `remaining`. It should print the total, and how many recharges were **10 pounds or more**.

For `12.5 5 10 7.25` it should print `Total: 34.75` and `Big: 2`. Instead, it never prints anything and never finishes. The program has **two** bugs: one makes the loop never stop, and one gives the wrong count. Find them and fix the program. Keep the countdown with `remaining` and the condition `remaining > 0`.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float amount;
    float total = 0;
    int big = 1;
    int remaining = 4;
    while (remaining > 0)
    {
        cin >> amount;
        total += amount;
        if (amount >= 10)
        {
            big++;
        }
        remaining++;
    }
    cout << "Total: " << total << endl;
    cout << "Big: " << big << endl;
    return 0;
}
```

## Expected behavior

The user types 4 amounts in pounds (they can have decimals). The program prints `Total: ` and the sum of the 4 amounts, then `Big: ` and how many of them are 10 or more. For `12.5 5 10 7.25` it prints `Total: 34.75` and `Big: 2`.

## Tests

### amounts with piastres

```input
12.5 5 10 7.25
```

```output
Total: 34.75
Big: 2
```

### small recharges only

```input
2.5 3 1.5 3
```

```output
Total: 10
Big: 0
```

### whole pounds

```input
20 10 5 15
```

```output
Total: 50
Big: 3
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    float amount;
    float total = 0;
    int big = 0;
    int remaining = 4;
    while (remaining > 0)
    {
        cin >> amount;
        total += amount;
        if (amount >= 10)
        {
            big++;
        }
        remaining--;
    }
    cout << "Total: " << total << endl;
    cout << "Big: " << big << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    float amount;
    float total = 0;
    int big = 0;
    int remaining = 4;
    while (remaining > 0)
    {
        cin >> amount;
        total += amount;
        if (amount >= 10)
        {
            big++;
        }
        remaining = remaining - 1;
    }
    cout << "Total: " << total << endl;
    cout << "Big: " << big << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    float amount;
    float total = 0;
    int big = 0;
    int remaining = 4;
    while (remaining > 0)
    {
        cin >> amount;
        total += amount;
        if (amount >= 10)
        {
            big++;
        }
        remaining -= 1;
    }
    cout << "Total: " << total << endl;
    cout << "Big: " << big << endl;
    return 0;
}
```

## Hints

- `remaining` starts at 4, and the loop stops when `remaining > 0` is FALSE. Which way must `remaining` move?
- `big` counts recharges of 10 or more. How many have been counted before the loop starts?

## Explanation

1. **The update goes the wrong way.** `remaining` starts at 4 and the loop goes on while `remaining > 0`. `remaining++` makes it 5, 6, 7 … so it moves **away** from the stopping condition, and `remaining > 0` stays TRUE forever. The update must move toward the stop: `remaining--` gives 3, 2, 1, 0, and at 0 the loop ends after exactly 4 passes.
2. **The counter starts at 1.** `big` is a counter of events: before the loop nothing has been counted yet, so it must start at **0**, just like the accumulator `total`. Starting at 1 adds one extra to every answer: the first test would print `Big: 3` instead of 2.

The accumulator is right: `total` is a `float` that starts at 0 before the loop, and `total += amount` adds each recharge, piastres included.
