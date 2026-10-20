---
slug: mcq-int-division-into-float
type: mcq
title: An average stored in a float
lesson: data-types
difficulty: medium
updated: 2026-10-09
---

## Question

`average` is a `float`, so it can hold decimals. What does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int total = 17;
    int count = 2;
    float average = total / count;
    cout << average << endl;
    return 0;
}
```

## Options

- [ ] `8.5`
  This is the true average, but the decimal part is lost before it ever reaches `average`.
- [x] `8`
  Right: `total / count` is `int / int`, so the result is 8. Storing 8 in a `float` doesn't bring the .5 back.
- [ ] `9`
  C++ does not round here. Whole-number division simply cuts off the decimal part.
- [ ] It doesn't compile.
  It compiles: an `int` value can be stored in a `float` box without any problem.

## Answer

```output
8
```

## Hints

- Work out the right side of `=` first. What are the types of `total` and `count`?
- What is `17 / 2` when both numbers are `int`?

## Explanation

An assignment works **right to left**: first C++ calculates `total / count`, and only then stores the result in `average`.

Both `total` and `count` are `int`, so the division is whole-number division: `17 / 2` is `8`, and the `.5` is thrown away. Then 8 is stored in the `float`. The box could hold 8.5, but it was given 8, so `cout` prints `8`.

To keep the decimal part, at least one value in the division must be a decimal type. For example, declare `float total = 17;`, then `total / count` gives `8.5`.
