---
slug: blanks-sum-of-n-numbers
type: correct_code
ask: blanks
title: Fill in the blanks to add up n numbers
lesson: counters-accumulators-and-input-loops
difficulty: medium
updated: 2026-10-10
---

## Question

The program reads how many numbers there are, then reads them and prints their sum. Fill in the **three blanks** so it works.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, x;
    int sum = ___;
    cin >> n;
    for (int i = 1; i ___ n; i++)
    {
        cin >> x;
        sum = ___;
    }
    cout << sum << endl;
    return 0;
}
```

## Expected behavior

The user types `n`, then `n` whole numbers. The program prints their sum.

## Tests

### three numbers

```input
3
4 10 6
```

```output
20
```

### one number

```input
1
9
```

```output
9
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, x;
    int sum = 0;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> x;
        sum = sum + x;
    }
    cout << sum << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, x;
    int sum = 0;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> x;
        sum = x + sum;
    }
    cout << sum << endl;
    return 0;
}
```

## Hints

- An accumulator must start at a value that doesn't change the sum.
- `i` starts at 1. Which comparison makes the loop run exactly `n` times?

## Explanation

1. `sum = 0`: an accumulator starts at 0, because adding to 0 changes nothing.
2. `i <= n`: counting from 1 **up to and including** `n` gives exactly `n` passes. With `i < n` the last number would never be read.
3. `sum = sum + x`: each new number is added to the running total.
