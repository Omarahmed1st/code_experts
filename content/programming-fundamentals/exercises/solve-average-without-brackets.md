---
slug: solve-average-without-brackets
type: mcq
title: An average without brackets
lesson: from-problem-to-program
difficulty: medium
updated: 2026-10-10
---

## Question

This program should print the average of 4, 8 and 12. The correct average is 8. What does it **actually** print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float n1 = 4, n2 = 8, n3 = 12;
    float average = n1 + n2 + n3 / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Options

- [ ] `Average = 8`
  That is the answer we want, but the line has no brackets, so the program does not add first.
- [x] `Average = 16`
  Right: division happens before addition, so it calculates 4 + 8 + (12 / 3) = 4 + 8 + 4 = 16.
- [ ] `Average = 4`
  12 / 3 is 4, but the program still adds `n1` and `n2` to it.
- [ ] `Average = 24`
  24 is the sum. The line still divides `n3` by 3 before adding.

## Answer

```output
Average = 16
```

## Hints

- In C++, as in maths, which happens first: `/` or `+`?
- Work out `n3 / 3` first, then do the additions.

## Explanation

In C++, as in maths, division happens **before** addition. So `n1 + n2 + n3 / 3` means `n1 + n2 + (n3 / 3)`, which is 4 + 8 + 4 = 16. Only `n3` was divided.

This is exactly why we test with values we can check by hand: we expected 8 and got 16, so we know the line is wrong. The fix is to add brackets so the sum is worked out first: `(n1 + n2 + n3) / 3`.
