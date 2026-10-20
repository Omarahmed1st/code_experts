---
slug: for-count-the-stars
type: mcq
title: How many stars?
lesson: for-loops
difficulty: medium
updated: 2026-10-10
---

## Question

How many stars `*` does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int i = 0; i <= 10; i += 2)
    {
        cout << "*";
    }
    cout << endl;
    return 0;
}
```

## Options

- [ ] 5
  That counts 2, 4, 6, 8, 10, but forgets the first pass, when `i` is 0.
- [x] 6
  Right: `i` takes the values 0, 2, 4, 6, 8 and 10. That is 6 passes, one star each.
- [ ] 10
  The loop doesn't count up to 10 one by one: `i += 2` jumps by 2 each time.
- [ ] 11
  That is how many values there are from 0 to 10 when you add 1 each time. Here the step is 2.

## Hints

- Write down every value `i` takes, starting with the initialization.
- The loop stops when the condition is false. What is the first value of `i` that makes `i <= 10` false?

## Explanation

The body runs once for every value of `i` that makes the condition true. Write them down: `i` starts at **0**, and each update adds 2: 0, 2, 4, 6, 8, 10. Then `i` becomes 12, `12 <= 10` is false, and the loop stops. That is **6** values, so 6 stars are printed: `******`.

The two common mistakes are forgetting the first value (starting at 0 is one extra pass) and forgetting the step size. When you are unsure, trace the first pass and the last one.
