---
slug: final-m2-io-which-typings-print-60
type: mcq
title: Which typings print Total = 60?
lesson: input-and-output-with-cout-and-cin
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This program reads the number of bus tickets and the price of one ticket, both whole numbers, with **one** `cin`. The user is supposed to buy 3 tickets at 20 pounds each.

Which of these ways of typing make the program print `Total = 60`? Pick **all** of them. (↵ means the user presses Enter.)

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets, price;
    cin >> tickets >> price;
    cout << "Total = " << tickets * price << endl;
    return 0;
}
```

## Options

- [x] `3 20` ↵
  Right: `cin` reads 3 into `tickets`, stops at the space, then reads 20 into `price`. 3 × 20 = 60.
- [x] `3` ↵ `20` ↵
  Right: one `cin` can read values typed on separate lines. After the first Enter it simply waits for the second value.
- [x] `20 3` ↵
  It prints `Total = 60` too, but only by luck: `tickets` gets 20 and `price` gets 3, the wrong way round. 20 × 3 is also 60, so the output can't show the mistake.
- [ ] `320` ↵
  `320` is one number with no space in it, so `tickets` gets 320 and the program keeps waiting for `price`. Nothing is printed yet.
- [ ] `3 2 0` ↵
  `tickets` gets 3 and `price` gets 2, because each space ends a value. It prints `Total = 6`, and the 0 is never read.

## Hints

- `cin >>` reads one value at a time and stops at a space or at Enter. Values are filled in the order of the `>>` arrows.
- For each option, write down what goes into `tickets` and what goes into `price`, then multiply.

## Explanation

`cin >> tickets >> price` reads two values, in order: the first goes into `tickets`, the second into `price`. A value ends at a space or at Enter, and it doesn't matter which one separates the two values.

- `3 20` and `3` ↵ `20` both put 3 in `tickets` and 20 in `price`.
- `20 3` swaps them. The product is the same, so the output still says 60, but the program now thinks there are 20 tickets at 3 pounds. A correct-looking output doesn't always mean the input was read correctly.
- `320` is a single value, so `cin` is still waiting for the price.
- `3 2 0` is three values: only the first two are read, giving 3 × 2 = 6.
