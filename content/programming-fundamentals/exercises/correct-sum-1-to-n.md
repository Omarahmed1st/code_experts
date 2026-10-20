---
slug: correct-sum-1-to-n
type: correct_code
title: Fix the sum from 1 to n
lesson: counters-accumulators-and-input-loops
difficulty: medium
updated: 2026-10-09
---

## Question

This program should read a whole number `n` and print the sum 1 + 2 + … + n. It has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum;
    int i = 1;
    while (i < n)
    {
        sum += i;
        i++;
    }
    cout << "Sum = " << sum << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number `n` (1 or more). The program prints `Sum = ` followed by 1 + 2 + … + n. For 5 it prints `Sum = 15`.

## Tests

### n is 5

```input
5
```

```output
Sum = 15
```

### n is 1

```input
1
```

```output
Sum = 1
```

### n is 10

```input
10
```

```output
Sum = 55
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int i = 1;
    while (i <= n)
    {
        sum += i;
        i++;
    }
    cout << "Sum = " << sum << endl;
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
    cin >> n;
    int sum = 0;
    int i = 1;
    while (i < n + 1)
    {
        sum += i;
        i++;
    }
    cout << "Sum = " << sum << endl;
    return 0;
}
```

## Hints

- An accumulator has to start somewhere. What is `sum` before the loop?
- For n = 5, does the loop ever add 5?

## Explanation

1. **`int sum;` has no starting value.** A local variable holds whatever was in memory, so `sum += i` adds to garbage. An accumulator must start at 0: `int sum = 0;`.
2. **`i < n` stops one step early.** For n = 5 the loop adds 1, 2, 3, 4 and stops when `i` is 5, so 5 is never added. Use `i <= n` (or `i < n + 1`).
