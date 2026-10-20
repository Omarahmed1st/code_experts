---
slug: final-m4-solve-read-the-test-results
type: mcq
title: What the test results tell you
lesson: from-problem-to-program
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This program should turn a temperature in °C into °F with the formula F = C × 9 / 5 + 32. The programmer tested it with four temperatures and wrote down the results:

| Typed C | Expected F | Program printed |
|---|---|---|
| `100` | 212 | `F = 212` |
| `0` | 32 | `F = 32` |
| `37` | 98.6 | `F = 98` |
| `-40` | -40 | `F = -40` |

Which statements are **true**? Pick **all** the true ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int c;
    cin >> c;
    int f = c * 9 / 5 + 32;
    cout << "F = " << f << endl;
    return 0;
}
```

## Options

- [x] The bug is the data type: `c` and `f` are `int`, so the decimal part of 98.6 is lost.
  True: `c * 9 / 5` is int / int, so for 37 it gives 333 / 5 = 66 instead of 66.6, and an `int` box can't hold 98.6 anyway. Making `c` and `f` `float` (or `double`) fixes it.
- [ ] Adding brackets, `(c * 9 / 5) + 32`, fixes the test with 37.
  False: `*` and `/` already happen before `+`, so these brackets change nothing. The program would still print `F = 98`.
- [ ] Writing `c * (9 / 5) + 32` would still give the right answers for 100, 0 and -40.
  False: now `9 / 5` is worked out first, and int / int gives 1. So 100 would give 100 × 1 + 32 = 132, not 212. Only the test with 0 would still pass.
- [x] A test whose correct answer is a whole number, such as 100, can never show this bug.
  True: when the exact answer has no decimal part, `c * 9 / 5` divides exactly and nothing is cut off. Only a test like 37, where the answer has a decimal part, shows the bug.

## Hints

- Three tests passed. What does that tell you about the order of the operations in line 7?
- Work out `37 * 9 / 5` the way C++ does when every value is an `int`.

## Explanation

Testing and debugging means reading the results carefully.

- The tests with 100, 0 and -40 give exactly the expected answers. So the **order** of the operations is right: `c * 9` first, then `/ 5`, then `+ 32`. Extra brackets around the first part change nothing.
- The test with 37 fails, and the expected answer, 98.6, has a decimal part. That points to the **data type**. `37 * 9 = 333`, and `333 / 5` with two `int`s gives 66, not 66.6. Then 66 + 32 = 98. And `f` is an `int`, so it could never hold 98.6.

This is the "analyze the requirements" step from the lecture: temperatures can have decimals, so `c` and `f` should be `float` (or `double`).

It also shows why a good set of tests needs variety. With whole-number answers only, the division is always exact, so the bug stays hidden. And beware of `9 / 5` written in brackets: with `int`s that is 1, which breaks even the tests that passed before.
