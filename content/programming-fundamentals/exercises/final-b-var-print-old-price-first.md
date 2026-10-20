---
slug: final-b-var-print-old-price-first
type: correct_code
title: The old price disappeared
lesson: variables-named-boxes-in-memory
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

This program reads a price and a discount (in pounds). It should print the old price, then the new price after the discount. For `250 40` it prints `Old price: 210` and `New price: 210`. Find the bug and fix it **without adding a new variable**.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price, discount;
    cin >> price >> discount;
    price = price - discount;
    cout << "Old price: " << price << endl;
    cout << "New price: " << price << endl;
    return 0;
}
```

## Expected behavior

The user types the price and the discount. The program prints `Old price: ` with the price that was typed, then `New price: ` with the price minus the discount. For `250 40` it prints `Old price: 250` and `New price: 210`.

## Tests

### price 250, discount 40

```input
250 40
```

```output
Old price: 250
New price: 210
```

### price 80, discount 15

```input
80 15
```

```output
Old price: 80
New price: 65
```

### no discount

```input
100 0
```

```output
Old price: 100
New price: 100
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price, discount;
    cin >> price >> discount;
    cout << "Old price: " << price << endl;
    price = price - discount;
    cout << "New price: " << price << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price, discount;
    cin >> price >> discount;
    cout << "Old price: " << price << endl;
    cout << "New price: " << price - discount << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price, discount;
    cin >> price >> discount;
    cout << "Old price: " << price << endl;
    cout << "New price: " << (price - discount) << endl;
    return 0;
}
```

## Hints

- After line 7 runs, what is inside the box `price`? Is the value the user typed still there?
- The old value must be printed **before** it is replaced.

## Explanation

A variable holds **one** value at a time. Line 7, `price = price - discount;`, works out `250 - 40 = 210` and stores it in `price`, replacing 250. The old value is gone, so both `cout` lines print 210.

The order of the steps is the bug. Print the old price first, while the box still holds 250, and only then store the new price. Another correct fix is to never change `price` at all and print the calculation `price - discount` directly.

The third test shows why one test is not enough: with a discount of 0 the old and new prices are equal, so the broken program looks correct there.
