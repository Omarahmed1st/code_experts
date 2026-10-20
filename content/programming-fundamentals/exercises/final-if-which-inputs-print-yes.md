---
slug: final-if-which-inputs-print-yes
type: mcq
title: Which inputs print YES?
lesson: decisions-if-then-else
difficulty: hard
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

This program makes two decisions, one after the other. The first decision **changes** `n`. For which typed values of `n` does the program print `YES`? Pick **all** the correct ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    if (n % 4 == 0)
    {
        n = n / 4;
    }
    else
    {
        n = n + 1;
    }
    if (n % 2 == 1)
    {
        cout << "YES" << endl;
    }
    else
    {
        cout << "NO" << endl;
    }
    return 0;
}
```

## Options

- [x] `12`
  Right: `12 % 4` is 0, so `n` becomes 12 / 4 = 3. `3 % 2` is 1, so it prints YES.
- [ ] `8`
  `8 % 4` is 0, so `n` becomes 8 / 4 = 2. `2 % 2` is 0, so it prints NO.
- [x] `6`
  Right: `6 % 4` is 2, not 0, so `n` becomes 6 + 1 = 7. `7 % 2` is 1, so it prints YES.
- [ ] `7`
  `7 % 4` is 3, so `n` becomes 7 + 1 = 8. `8 % 2` is 0, so it prints NO, even though 7 itself is odd.

## Hints

- Trace each value separately: first decide which path of the first `if` runs, then work out the **new** `n`.
- The second decision tests the new `n`, not the number that was typed.

## Explanation

The two decisions run one after the other, and the first one changes `n`, so the second one tests the **new** value.

- `12`: divisible by 4, so `n` becomes 3, which is odd → YES.
- `8`: divisible by 4, so `n` becomes 2, which is even → NO.
- `6`: not divisible by 4 (remainder 2), so `n` becomes 7, which is odd → YES.
- `7`: not divisible by 4 (remainder 3), so `n` becomes 8, which is even → NO.

A common mistake is to check the typed number directly: 7 is odd, but the program prints NO for it. Always trace the variable through every line that changes it.
