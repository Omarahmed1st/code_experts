---
slug: final-b-solve-tests-that-catch-the-bug
type: mcq
title: Which tests catch the missing brackets?
lesson: from-problem-to-program
difficulty: hard
reserved: true
multiple: true
updated: 2026-10-10
---

## Question

This program should print the average of three numbers, but the brackets are missing. You want to test it. For each test below, work out what the program prints and what the correct average is.

Which tests would **show** that the program is wrong? Pick **all** of them.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float n1, n2, n3;
    cin >> n1 >> n2 >> n3;
    float average = n1 + n2 + n3 / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Options

- [x] The user types `3 6 9`.
  It shows the bug: the program prints 3 + 6 + 3 = 12, but the average is 18 / 3 = 6.
- [ ] The user types `0 0 12`.
  It hides the bug: the program prints 0 + 0 + 4 = 4, and the real average is 12 / 3 = 4. The output looks correct.
- [x] The user types `2 4 0`.
  It shows the bug: the program prints 2 + 4 + 0 = 6, but the average is 6 / 3 = 2.
- [ ] The user types `0 0 0`.
  It hides the bug: the program prints 0, and the real average is also 0.

## Hints

- Division happens before addition, so the program works out `n1 + n2 + (n3 / 3)`.
- For each test, compare that value with `(n1 + n2 + n3) / 3`. The test only helps if the two are different.

## Explanation

Because division comes before addition, line 7 really calculates `n1 + n2 + (n3 / 3)`. Only `n3` is divided.

A test only shows a bug when the program's output is different from the answer you worked out by hand:

| Test | Program prints | Correct average | Bug seen? |
|---|---|---|---|
| `3 6 9` | 3 + 6 + 3 = 12 | 6 | yes |
| `0 0 12` | 0 + 0 + 4 = 4 | 4 | no |
| `2 4 0` | 2 + 4 + 0 = 6 | 2 | yes |
| `0 0 0` | 0 | 0 | no |

When `n1` and `n2` are both 0, the wrong formula and the right one give the same number, so those tests pass even though the program is broken. This is why one test is never enough: choose several test cases with different values, and check each one by hand. The fix is `(n1 + n2 + n3) / 3`.
