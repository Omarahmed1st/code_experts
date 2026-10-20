---
slug: final-m3-if-assign-zero-credit
type: mcq
title: One = with a zero
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

The programmer wanted to print `No credit` when the phone credit is 0, and the credit otherwise. Look closely at the condition: it has **one** `=`, and the value is **0**. The credit starts at 12. What does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit = 12;
    if (credit = 0)
    {
        cout << "No credit" << endl;
    }
    else
    {
        cout << "Credit: " << credit << endl;
    }
    return 0;
}
```

## Options

- [x] `Credit: 0`
  Right: `credit = 0` stores 0 in `credit`. The value 0 counts as FALSE, so the `else` path runs, and it prints the new value, 0.
- [ ] `Credit: 12`
  The `else` path does run, but the condition has already **stored** 0 in `credit`, replacing the 12. So 0 is printed.
- [ ] `No credit`
  That would happen if a single `=` always made the condition TRUE. It doesn't: after storing, the condition's value is the value stored. Here that is 0, and 0 counts as FALSE.
- [ ] `No credit`, then `Credit: 0`
  Only one path of an `if … else` runs each time, never both.

## Answer

```output
Credit: 0
```

## Hints

- `=` stores and `==` compares. What does `credit = 0` do to the box `credit`?
- A value that isn't 0 counts as TRUE. What does 0 count as?

## Explanation

The condition `credit = 0` has one `=`, so it is an **assignment**, not a comparison. Two things happen:

1. The value 0 is stored in `credit`. The 12 is gone.
2. The condition uses the value that was stored, 0. In C++ a value that isn't 0 counts as TRUE, and **0 counts as FALSE**.

So the `else` path runs and prints `Credit: ` followed by the value `credit` holds now: `Credit: 0`.

This bug is sneaky in both directions. With `if (mark = 50)` the wrong path is always the TRUE one; with `= 0` it is always the FALSE one, and the variable is wiped out as well. The fix is `if (credit == 0)`, which compares and changes nothing; then the program prints `Credit: 12`.
