---
slug: types-bool-prints-as-number
type: mcq
title: Printing a bool
lesson: data-types
difficulty: easy
updated: 2026-10-10
---

## Question

A program stores whether a student has paid the fees. What does it print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    bool feesPaid = false;
    cout << feesPaid << endl;
    return 0;
}
```

## Options

- [ ] `false`
  The value is `false`, but by default `cout` does not print the word. It prints the number used to store it.
- [x] `0`
  Right: `false` is stored as 0, and `cout` prints a `bool` as that number.
- [ ] `1`
  1 is how `cout` prints `true`. This variable holds `false`.
- [ ] `feesPaid`
  `feesPaid` has no quotes, so `cout` prints the value inside the box, not its name.

## Answer

```output
0
```

## Hints

- Inside the computer, `true` and `false` are stored as numbers. Which numbers?
- In the lecture, what did `cout << fanOn` print when `fanOn` was `true`?

## Explanation

A `bool` holds only `true` or `false`. Inside the computer, `true` is stored as `1` and `false` as `0`, and by default `cout` prints a `bool` as that number.

So `cout << feesPaid` prints `0`. The value is still `false`; only the way it is printed is a number.
