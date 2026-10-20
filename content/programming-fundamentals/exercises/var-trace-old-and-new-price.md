---
slug: var-trace-old-and-new-price
type: trace
title: Old price and new price
lesson: variables-named-boxes-in-memory
difficulty: easy
updated: 2026-10-10
---

## Question

A shop changes the price of a notebook (in pounds). Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price = 50;
    int oldPrice = price;
    price = 65;
    cout << "old: " << oldPrice << endl;
    cout << "new: " << price << endl;
    oldPrice = price;
    price = 80;
    cout << oldPrice << " " << price << endl;
    return 0;
}
```

## Answer

```output
old: 50
new: 65
65 80
```

## Hints

- Draw two boxes, `price` and `oldPrice`, and write the value in each box after every line.
- `oldPrice = price;` copies the value that is in `price` **at that moment**. Does `oldPrice` change later when `price` changes?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | create `price`, store 50 | price = 50 | |
| 6 | copy the value of `price` into `oldPrice` | price = 50; oldPrice = 50 | |
| 7 | 65 replaces 50 in `price` | price = 65; oldPrice = 50 | |
| 8 | print the text, then the value of `oldPrice` | price = 65; oldPrice = 50 | old: 50\n |
| 9 | print the text, then the value of `price` | price = 65; oldPrice = 50 | new: 65\n |
| 10 | copy the value of `price` into `oldPrice` | price = 65; oldPrice = 65 | |
| 11 | 80 replaces 65 in `price` | price = 80; oldPrice = 65 | |
| 12 | print both values with a space between | price = 80; oldPrice = 65 | 65 80\n |

## Explanation

`oldPrice = price;` copies the **value** that is in `price` right now into `oldPrice`. It does not link the two boxes. So on line 6 `oldPrice` gets 50, and when `price` changes to 65 on line 7, `oldPrice` still holds 50.

The same happens again on lines 10 and 11: `oldPrice` gets a copy of 65, then `price` changes to 80, and `oldPrice` keeps 65. Each box holds one value, and it only changes when a new value is stored **in that box**.
