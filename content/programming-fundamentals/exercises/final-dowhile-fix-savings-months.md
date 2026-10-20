---
slug: final-dowhile-fix-savings-months
type: correct_code
title: Fix the savings months
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Omar has some money saved and wants to buy a phone. He adds **50 pounds** every month. This program reads the money he has now and the price of the phone, and should print how many months he must wait until he has **at least** the price. If he already has enough, the answer is **0** months. The program has **two** bugs, one of them in the choice of loop. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int amount, price;
    cin >> amount >> price;
    int months = 0;
    do
    {
        amount += 50;
        months++;
    }
    while (amount <= price);
    cout << "Months: " << months << endl;
    return 0;
}
```

## Expected behavior

The user types two whole numbers: the money Omar has now and the price of the phone. The program prints `Months: ` and the number of months of saving 50 pounds until the money is at least the price. For `100 200` it prints `Months: 2` (150, then 200). For `300 200` it prints `Months: 0`.

## Tests

### reaches the price exactly

```input
100 200
```

```output
Months: 2
```

### already has enough

```input
300 200
```

```output
Months: 0
```

### goes past the price

```input
120 300
```

```output
Months: 4
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int amount, price;
    cin >> amount >> price;
    int months = 0;
    while (amount < price)
    {
        amount += 50;
        months++;
    }
    cout << "Months: " << months << endl;
    return 0;
}
```

## Hints

- If Omar already has enough money, how many times should the body run? Can a `do-while` body run zero times?
- "At least the price" means he can stop when `amount` equals `price`. Should the loop go on when `amount` is exactly 200 and the price is 200?

## Explanation

1. **The wrong loop.** A `do-while` always runs its body at least once, so even when Omar already has enough, it adds a month and prints `Months: 1`. Here the body must be able to run **zero** times, and that is what a `while` loop does: it checks the condition **before** the first pass.
2. **The boundary.** The loop should keep going only while Omar has **less** than the price: `amount < price`. With `amount <= price`, the loop also runs when he has exactly enough (200 of 200), so it adds one month too many: 3 instead of 2.

The test `120 300` passes even with both bugs (120 → 170 → 220 → 270 → 320 is 4 months either way). Only the tests on the edges, an exact match and "already enough", show the bugs. This is why the boundary and the zero case belong in every test plan.
