---
slug: final-m3-if-fix-semicolon-discount
type: correct_code
title: A discount that everyone gets
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

During Ramadan a supermarket takes **10%** off any bill of **100 pounds or more**. Smaller bills are paid in full. This program reads the bill and prints what the customer pays. For a bill of `60` it prints `Pay: 54`: the small bill got the discount too. The condition is also wrong at the boundary, which you will only notice once the first bug is fixed: a bill of exactly `100` must get the discount.

The program has **two** bugs, both on line 7. Find them and fix that line. Don't change any other line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float total;
    cin >> total;
    if (total > 100);
    {
        total = total - total / 10;
    }
    cout << "Pay: " << total << endl;
    return 0;
}
```

## Expected behavior

The user types the bill in pounds (it can have piastres, such as `99.5`). For a bill of 100 or more, the program prints `Pay: ` and the bill minus 10%. For a smaller bill, it prints `Pay: ` and the bill unchanged. For `250` it prints `Pay: 225`, for `100` it prints `Pay: 90`, and for `60` it prints `Pay: 60`.

## Tests

### a small bill

```input
60
```

```output
Pay: 60
```

### exactly 100

```input
100
```

```output
Pay: 90
```

### a big bill

```input
250
```

```output
Pay: 225
```

### just under 100

```input
99.5
```

```output
Pay: 99.5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    float total;
    cin >> total;
    if (total >= 100)
    {
        total = total - total / 10;
    }
    cout << "Pay: " << total << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    float total;
    cin >> total;
    if (100 <= total)
    {
        total = total - total / 10;
    }
    cout << "Pay: " << total << endl;
    return 0;
}
```

## Hints

- Look at the very end of line 7. What does a `;` right after `if ( )` do to the block below it?
- "100 pounds or more" must include 100. Is `100 > 100` TRUE?

## Explanation

1. **The semicolon after `if ( )`.** A `;` on its own is an empty statement, so `if (total > 100);` means "if the bill is more than 100, do nothing". The decision ends right there. The block in braces below it is no longer part of the `if`: it is an ordinary block that runs **every time**. That is why the bill of 60 got 10% off and became 54. Remove the `;` so the block belongs to the `if` again. (It is the same mistake as a `;` right after `while ( )` or `for ( )`.)
2. **The boundary.** "100 or more" includes 100, so the condition must be `total >= 100`. With `>`, a bill of exactly 100 would be paid in full. Because a bill can have piastres, `total > 99` would be wrong too: it would give the discount to 99.5.

The test with 60 shows the first bug and the test with exactly 100 shows the second one. That is why tests should cover both paths of a decision and the boundary value.
