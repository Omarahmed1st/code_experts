---
slug: debug-sum-of-evens-fix
type: correct_code
title: Fix the sum of the even numbers
lesson: loops-with-decisions-and-debugging
difficulty: hard
updated: 2026-10-10
---

## Question

This program should read **5** whole numbers (0 or more) and add up only the **even** ones. For `1 2 3 4 5` it should print `Sum of even numbers: 6`, but it prints `Sum of even numbers: 5`. It has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    int sum = 0;
    for (int i = 1; i <= 5; i++)
    {
        sum = 0;
        cin >> n;
        if (n % 2 == 1)
        {
            sum += n;
        }
    }
    cout << "Sum of even numbers: " << sum << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole numbers (0 or more). The program prints `Sum of even numbers: ` followed by the total of the even ones. For `1 2 3 4 5` it prints `Sum of even numbers: 6`, because 2 + 4 = 6.

## Tests

### a mix of odd and even numbers

```input
1 2 3 4 5
```

```output
Sum of even numbers: 6
```

### the last number is even

```input
10 3 8 7 6
```

```output
Sum of even numbers: 24
```

### all numbers are even

```input
2 4 6 8 10
```

```output
Sum of even numbers: 30
```

### no even numbers

```input
1 3 5 7 9
```

```output
Sum of even numbers: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    int sum = 0;
    for (int i = 1; i <= 5; i++)
    {
        cin >> n;
        if (n % 2 == 0)
        {
            sum += n;
        }
    }
    cout << "Sum of even numbers: " << sum << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    int sum = 0;
    for (int i = 1; i <= 5; i++)
    {
        cin >> n;
        if (n % 2 != 1)
        {
            sum += n;
        }
    }
    cout << "Sum of even numbers: " << sum << endl;
    return 0;
}
```

## Hints

- Make a trace table for `1 2 3 4 5` with the columns `i`, `n` and `sum`. What happens to `sum` at the start of every pass?
- Which remainder does an even number give when you divide it by 2?

## Explanation

1. **The accumulator is reset in every pass.** `sum = 0;` is inside the loop, so the total is thrown away at the start of each pass. At the end, `sum` holds only what the **last** pass added. An accumulator must start at 0 **once**, before the loop; `int sum = 0;` already does that, so delete the line inside the loop.
2. **The decision picks the odd numbers.** `n % 2 == 1` is true for odd numbers. An even number has no remainder, so the condition must be `n % 2 == 0`.

With both bugs, the input `1 2 3 4 5` gives 5: in the last pass `sum` is reset to 0, then 5 (odd) is added. With the fixes, only 2 and 4 are added, and the program prints 6. A trace table with a `sum` column shows the first bug right away: `sum` drops back to 0 in every row.
