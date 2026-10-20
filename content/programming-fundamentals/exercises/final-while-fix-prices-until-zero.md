---
slug: final-while-fix-prices-until-zero
type: correct_code
title: Fix the prices loop that never ends
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A cashier types the prices of the items in pounds, one by one, and types **0** to finish. The program should print the total, and how many items cost **100 pounds or more**. It has **two** bugs: one makes the loop never stop, and one counts the wrong items. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price;
    int total = 0;
    int expensive = 0;
    cin >> price;
    while (price != 0)
    {
        total += price;
        if (price > 100)
        {
            expensive++;
        }
    }
    cout << "Total: " << total << endl;
    cout << "Expensive: " << expensive << endl;
    return 0;
}
```

## Expected behavior

The user types whole-number prices and then `0`. The program prints `Total: ` and the sum of the prices, then `Expensive: ` and how many prices are 100 or more. For `40 100 250 0` it prints `Total: 390` and `Expensive: 2`.

## Tests

### one price is exactly 100

```input
40 100 250 0
```

```output
Total: 390
Expensive: 2
```

### only cheap items

```input
20 30 0
```

```output
Total: 50
Expensive: 0
```

### no items at all

```input
0
```

```output
Total: 0
Expensive: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price;
    int total = 0;
    int expensive = 0;
    cin >> price;
    while (price != 0)
    {
        total += price;
        if (price >= 100)
        {
            expensive++;
        }
        cin >> price;
    }
    cout << "Total: " << total << endl;
    cout << "Expensive: " << expensive << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price;
    int total = 0;
    int expensive = 0;
    cin >> price;
    while (price != 0)
    {
        total += price;
        if (price > 99)
        {
            expensive++;
        }
        cin >> price;
    }
    cout << "Total: " << total << endl;
    cout << "Expensive: " << expensive << endl;
    return 0;
}
```

## Hints

- What is the update of this loop? Which line could ever make `price != 0` FALSE after the first pass?
- "100 or more" must include 100. Try `100 > 100`.

## Explanation

1. **The loop never stops.** The condition `price != 0` depends on `price`, but nothing inside the loop changes `price`. The first price is read once, before the loop, and then the same price is added again and again forever. For an input loop, the "update" is reading the **next** value, so `cin >> price;` must also be the last line of the body. Then the loop goes: check, add, decide, read the next price, check again, and it stops when the 0 arrives.
2. **The boundary is wrong.** "100 or more" means `price >= 100` (or `price > 99` for whole numbers). With `price > 100`, an item that costs exactly 100 is not counted.

The read must be at the **end** of the body: if it came before `total += price`, the first price would be lost, and the final 0 would be checked as if it were a price.
