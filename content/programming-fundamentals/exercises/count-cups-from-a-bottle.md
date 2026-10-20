---
slug: count-cups-from-a-bottle
type: trace
ask: count
title: How many cups from the bottle?
lesson: counters-accumulators-and-input-loops
difficulty: easy
updated: 2026-10-10
---

## Question

A 1500 ml bottle of juice is poured into cups of 250 ml, as long as there is enough juice left for a full cup. **How many times does the body of the `while` loop run?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int bottle = 1500;
    int cups = 0;
    while (bottle >= 250)
    {
        bottle = bottle - 250;
        cups++;
    }
    cout << "Left in the bottle: " << bottle << " ml" << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int bottle = 1500;
    int cups = 0;
    int runs = 0;
    while (bottle >= 250)
    {
        bottle = bottle - 250;
        cups++;
        runs++;
    }
    cout << runs << endl;
    return 0;
}
```

## Answer

```output
6
```

## Hints

- Write down `bottle` before each check: 1500, then 1250, then …
- Look closely at the condition: is 250 ml enough for one more cup?

## Explanation

Each pass pours one cup, so the number of passes is the number of cups.

| Pass | bottle before | Check | bottle after | cups |
|---|---|---|---|---|
| 1 | 1500 | 1500 >= 250 TRUE | 1250 | 1 |
| 2 | 1250 | 1250 >= 250 TRUE | 1000 | 2 |
| 3 | 1000 | 1000 >= 250 TRUE | 750 | 3 |
| 4 | 750 | 750 >= 250 TRUE | 500 | 4 |
| 5 | 500 | 500 >= 250 TRUE | 250 | 5 |
| 6 | 250 | 250 >= 250 TRUE | 0 | 6 |

The next check is `0 >= 250`, which is FALSE, so the body runs **6** times and the program prints `Left in the bottle: 0 ml`. The last cup is the tricky one: `>=` includes 250, so the last 250 ml still fill a cup. With `>` the answer would be 5.
