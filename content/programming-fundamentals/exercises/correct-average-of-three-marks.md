---
slug: correct-average-of-three-marks
type: correct_code
title: Fix the average of three marks
lesson: input-and-output-with-cout-and-cin
difficulty: medium
updated: 2026-10-09
---

## Question

This program reads three whole-number marks and should print their average **with** the decimal part. For the marks 10, 20 and 25 it prints `Average = 18`, but the real average is 18.3333. Find the bug and fix it.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark1, mark2, mark3;
    cin >> mark1 >> mark2 >> mark3;
    float average = (mark1 + mark2 + mark3) / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Expected behavior

The user types three whole numbers. The program prints `Average = ` followed by their average, keeping the decimal part. For `10 20 25` it prints `Average = 18.3333`.

## Tests

### marks 10, 20 and 25

```input
10 20 25
```

```output
Average = 18.3333
```

### marks 7, 8 and 8

```input
7 8 8
```

```output
Average = 7.66667
```

### marks 4, 5 and 6 (a whole-number average)

```input
4 5 6
```

```output
Average = 5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark1, mark2, mark3;
    cin >> mark1 >> mark2 >> mark3;
    float average = (mark1 + mark2 + mark3) / 3.0;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark1, mark2, mark3;
    cin >> mark1 >> mark2 >> mark3;
    float average = (mark1 + mark2 + mark3) / 3.0f;
    cout << "Average = " << average << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark1, mark2, mark3;
    cin >> mark1 >> mark2 >> mark3;
    float average = (float)(mark1 + mark2 + mark3) / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    float mark1, mark2, mark3;
    cin >> mark1 >> mark2 >> mark3;
    float average = (mark1 + mark2 + mark3) / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Hints

- `average` is a `float`, so the problem is not where the result is stored. Look at the calculation on the right of `=`.
- What are the types of `mark1 + mark2 + mark3` and `3`? What does `int / int` do?

## Explanation

The right side of `=` is worked out first. `mark1 + mark2 + mark3` is an `int` (55 for 10, 20, 25) and `3` is an `int`, so `55 / 3` is whole-number division and gives `18`. The decimal part is already gone before the result is stored in the `float`.

The fix: make one side of the division a decimal number. Writing `3.0` instead of `3` does it: `55 / 3.0` is 18.3333. Declaring the marks as `float` works too.

The third test shows why one test is never enough: for 4, 5 and 6 the sum is 15, and `15 / 3` is exactly 5, so the broken program looks correct there.
