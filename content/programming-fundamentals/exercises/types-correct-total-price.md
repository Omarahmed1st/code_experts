---
slug: types-correct-total-price
type: correct_code
title: Fix the total price
lesson: data-types
difficulty: medium
updated: 2026-10-10
---

## Question

A pen costs 12.5 pounds. This program should print the price of 3 pens, but it prints `Total = 36`. There is **one** bug: a variable has the wrong data type. Find it and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price = 12.5;
    int quantity = 3;
    cout << "Total = " << price * quantity << endl;
    return 0;
}
```

## Expected behavior

The program prints `Total = 37.5` (12.5 × 3).

## Tests

### 3 pens at 12.5 pounds

```output
Total = 37.5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    float price = 12.5;
    int quantity = 3;
    cout << "Total = " << price * quantity << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    double price = 12.5;
    int quantity = 3;
    cout << "Total = " << price * quantity << endl;
    return 0;
}
```

## Hints

- What is really stored in `price` after line 5? Is it still 12.5?
- Which variable can have a decimal part: the price or the number of pens?

## Explanation

`int price = 12.5;` stores 12.5 in a box that only holds whole numbers, so C++ drops the `.5` and `price` holds 12. Then 12 × 3 = 36, and the program prints `Total = 36`.

A price can have a decimal part, so it needs a decimal type: `float price = 12.5;` (or `double`). The quantity is a count of pens, a whole number, so `int` is right for it. With `price` as a `float`, 12.5 × 3 gives 37.5.
