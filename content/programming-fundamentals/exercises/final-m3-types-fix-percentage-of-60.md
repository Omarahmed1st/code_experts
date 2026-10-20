---
slug: final-m3-types-fix-percentage-of-60
type: correct_code
title: A mark out of 60 as a percentage
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A quiz is marked out of **60**. This program reads a student's mark and should print it as a percentage, **with** the decimal part: 45 out of 60 is 75%, and 50 out of 60 is 83.3333%. Instead, it prints `Percent: 0` for every mark below 60.

Line 7 has **two** problems, one with a data type and one with the division. Fix the program by changing **only line 7**. Keep `int mark;` as it is.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    int percent = mark / 60 * 100;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

## Expected behavior

The user types a whole-number mark from 0 to 60. The program prints `Percent: ` followed by the mark as a percentage of 60, keeping the decimal part. For `45` it prints `Percent: 75`, and for `50` it prints `Percent: 83.3333`.

## Tests

### 45 out of 60

```input
45
```

```output
Percent: 75
```

### a percentage with decimals

```input
50
```

```output
Percent: 83.3333
```

### full marks

```input
60
```

```output
Percent: 100
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    float percent = mark / 60.0 * 100;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    double percent = mark / 60.0 * 100;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    float percent = mark * 100.0 / 60;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    double percent = mark * 100.0 / 60;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    float percent = mark * 100 / 60.0;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    double percent = mark * 100 / 60.0;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    float percent = mark / 60.0 * 100.0;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    double percent = mark / 60.0 * 100.0;
    cout << "Percent: " << percent << endl;
    return 0;
}
```

## Hints

- Work out `45 / 60` the way C++ does when both numbers are `int`. What is left after the decimal part is cut off?
- Even when the division keeps its decimals, can an `int` box hold 83.3333?

## Explanation

C++ works out `mark / 60 * 100` from left to right, so the division comes **first**.

1. **The division.** `mark` and `60` are both `int`, so `45 / 60` is whole-number division: 0.75 loses its decimal part and becomes `0`. Then `0 * 100` is still `0`. That is why every mark below 60 gives 0%. Dividing by `60.0` (a decimal number) keeps the decimals: `45 / 60.0` is 0.75, and `0.75 * 100` is 75.
2. **The data type.** Even with the right calculation, `int percent` can't hold 83.3333; it would keep only 83. Declare `percent` as `float` (or `double`) so the decimal part survives.

Fixing only one of the two is not enough: `float percent = mark / 60 * 100;` still prints 0, and `int percent = mark / 60.0 * 100;` prints 83 instead of 83.3333. Multiplying first, as in `mark * 100.0 / 60`, is also correct, as long as one of the numbers is a decimal number and the box is a `float` or `double`.
