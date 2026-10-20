---
slug: count-while-doubling-runs
type: trace
ask: count
title: How many times does the doubling loop run?
lesson: while-loops-in-cpp
difficulty: medium
updated: 2026-10-10
---

## Question

Read the program. **How many times does the body of the `while` loop run?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int coins = 3;
    while (coins < 50)
    {
        coins = coins * 2;
    }
    cout << coins << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int coins = 3;
    int runs = 0;
    while (coins < 50)
    {
        coins = coins * 2;
        runs = runs + 1;
    }
    cout << runs << endl;
    return 0;
}
```

## Answer

```output
5
```

## Hints

- Write down `coins` before each check: 3, then 6, then …
- The loop stops at the first check where `coins < 50` is FALSE.

## Explanation

Count the passes. Before each pass the condition `coins < 50` is checked:

| Pass | coins before | Check | coins after |
|---|---|---|---|
| 1 | 3 | 3 < 50 TRUE | 6 |
| 2 | 6 | 6 < 50 TRUE | 12 |
| 3 | 12 | 12 < 50 TRUE | 24 |
| 4 | 24 | 24 < 50 TRUE | 48 |
| 5 | 48 | 48 < 50 TRUE | 96 |

The next check is `96 < 50`, which is FALSE, so the loop stops after **5** passes and the program prints 96. A common slip is to stop at 48 and say 4: 48 is still less than 50, so there is one more pass.
