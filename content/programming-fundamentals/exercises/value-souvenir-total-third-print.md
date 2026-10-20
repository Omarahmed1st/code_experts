---
slug: value-souvenir-total-third-print
type: trace
ask: value
title: What is the total after the third souvenir?
lesson: counters-accumulators-and-input-loops
difficulty: hard
updated: 2026-10-10
---

## Question

At a market every souvenir costs 5 pounds more than the one before. The first one costs 20 pounds. What is the value of `total` **when the `cout` on line 11 runs for the third time**? Type just the number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price = 20;
    int total = 0;
    int item = 1;
    while (item <= 5)
    {
        total = total + price;
        cout << "Bought souvenir " << item << endl;
        price = price + 5;
        item++;
    }
    cout << "Total: " << total << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int price = 20;
    int total = 0;
    int item = 1;
    while (item <= 5)
    {
        total = total + price;
        if (item == 3)
        {
            cout << total << endl;
        }
        price = price + 5;
        item++;
    }
    return 0;
}
```

## Answer

```output
75
```

## Hints

- Line 11 runs once per pass. The third time it runs, `item` is 3.
- In each pass, `total` grows **before** the `cout`, and `price` grows **after** it.

## Explanation

Line 11 is `cout << "Bought souvenir " << item << endl;`. It runs once in every pass, so its third run is in the third pass. Follow the variables at that moment:

| Pass (item) | price used | total when line 11 runs | price after the pass |
|---|---|---|---|
| 1 | 20 | 0 + 20 = 20 | 25 |
| 2 | 25 | 20 + 25 = 45 | 30 |
| 3 | 30 | 45 + 30 = **75** | 35 |

So `total` is **75** the third time line 11 runs.

The program goes on for two more passes (35 and 40 pounds), and the last line prints `Total: 150`. That is the value **after** the loop, not at the third `cout`. Another slip is to add 25 + 30 + 35: the price only goes up after it has been added.
