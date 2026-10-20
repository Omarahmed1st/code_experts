---
slug: final-exam-fix-average-of-passes
type: correct_code
title: Fix the average of the passing marks
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads the marks of **4** students. It should count how many passed (a mark of 50 or more) and print the **average of the passing marks only**, with the decimal part. For `60 45 75 30` it should print `Passed: 2` and `Average of passes: 67.5`. It has **two** bugs. Find them and fix the program. (You can assume at least one student passes.)

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passCount = 0;
    int passSum = 0;
    for (int i = 1; i <= 4; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passCount++;
        }
        passSum += mark;
    }
    float average = passSum / passCount;
    cout << "Passed: " << passCount << endl;
    cout << "Average of passes: " << average << endl;
    return 0;
}
```

## Expected behavior

The user types 4 whole-number marks. The program prints `Passed: ` and how many marks are 50 or more, then `Average of passes: ` and the average of those marks only, with the decimal part.

## Tests

### two passes

```input
60 45 75 30
```

```output
Passed: 2
Average of passes: 67.5
```

### three passes, one on the boundary

```input
50 51 90 10
```

```output
Passed: 3
Average of passes: 63.6667
```

### everyone passes

```input
70 80 90 60
```

```output
Passed: 4
Average of passes: 75
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passCount = 0;
    float passSum = 0;
    for (int i = 1; i <= 4; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passCount++;
            passSum += mark;
        }
    }
    float average = passSum / passCount;
    cout << "Passed: " << passCount << endl;
    cout << "Average of passes: " << average << endl;
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
    int passCount = 0;
    double passSum = 0;
    for (int i = 1; i <= 4; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passCount++;
            passSum += mark;
        }
    }
    float average = passSum / passCount;
    cout << "Passed: " << passCount << endl;
    cout << "Average of passes: " << average << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passCount = 0;
    float passSum = 0;
    for (int i = 1; i <= 4; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passSum += mark;
            passCount++;
        }
    }
    float average = passSum / passCount;
    cout << "Passed: " << passCount << endl;
    cout << "Average of passes: " << average << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passCount = 0;
    double passSum = 0;
    for (int i = 1; i <= 4; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passSum += mark;
            passCount++;
        }
    }
    float average = passSum / passCount;
    cout << "Passed: " << passCount << endl;
    cout << "Average of passes: " << average << endl;
    return 0;
}
```

## Hints

- Which marks should go into `passSum`: every mark, or only the passing ones? Where is `passSum += mark;` now?
- `average` is a `float`, but what are the types of `passSum` and `passCount` in the division?

## Explanation

1. **Every mark is added, not only the passes.** `passSum += mark;` is after the `if`, so it runs in every pass of the loop, for failing marks too. It must be **inside** the `if` braces, next to `passCount++`, so that both the counter and the accumulator only change for a pass.
2. **Integer division.** `passSum / passCount` divides two `int` values, so the decimal part is cut off **before** the result is stored in the `float` `average`: 135 / 2 gives 67, not 67.5. Declaring the accumulator `passSum` as `float` (or `double`) makes the division keep the decimals.

The two fixes work together: with only the first one, `60 45 75 30` gives 67; with only the second, the failing marks are still in the sum.
