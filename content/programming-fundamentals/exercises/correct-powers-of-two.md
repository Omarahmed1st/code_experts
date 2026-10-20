---
slug: correct-powers-of-two
type: correct_code
title: Fix the powers of two
lesson: counters-accumulators-and-input-loops
difficulty: hard
updated: 2026-10-09
---

## Question

This program should read a whole number `n` and print 2 to the power `n`, by multiplying 2 by itself `n` times. For example, 2 to the power 3 is 2 × 2 × 2 = 8. It has **two** bugs: one gives the wrong answer, and one makes the loop never stop. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int result = 0;
    int count = 1;
    while (count <= n)
    {
        result = result * 2;
    }
    cout << "2 to the power " << n << " = " << result << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number `n` (0 or more). The program prints `2 to the power n = ` followed by the answer. For 3 it prints `2 to the power 3 = 8`. For 0 it prints 1, because 2 to the power 0 is 1.

## Tests

### n is 3

```input
3
```

```output
2 to the power 3 = 8
```

### n is 10

```input
10
```

```output
2 to the power 10 = 1024
```

### n is 0 (the loop doesn't run)

```input
0
```

```output
2 to the power 0 = 1
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int result = 1;
    int count = 1;
    while (count <= n)
    {
        result = result * 2;
        count++;
    }
    cout << "2 to the power " << n << " = " << result << endl;
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
    int result = 1;
    int count = 1;
    while (count <= n)
    {
        result = result * 2;
        count = count + 1;
    }
    cout << "2 to the power " << n << " = " << result << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int result = 1;
    int count = 1;
    while (count <= n)
    {
        result = result * 2;
        count += 1;
    }
    cout << "2 to the power " << n << " = " << result << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int result = 1;
    int count = 1;
    while (count <= n)
    {
        count++;
        result = result * 2;
    }
    cout << "2 to the power " << n << " = " << result << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int result = 1;
    int count = 1;
    while (count <= n)
    {
        result *= 2;
        count++;
    }
    cout << "2 to the power " << n << " = " << result << endl;
    return 0;
}
```

## Hints

- Inside the loop, does anything change `count`? What happens to the condition `count <= n`?
- An accumulator that **adds** starts at 0. What should one that **multiplies** start at? What is 0 × 2?

## Explanation

1. **The update is missing.** Nothing inside the loop changes `count`, so `count <= n` stays true forever (for any `n` of 1 or more) and the program never finishes. Add `count++;` to the body, so `count` moves toward the stopping point.
2. **`result` starts at 0.** 0 × 2 is 0, and 0 × 2 × 2 × 2 is still 0, so the answer would always be 0. A running total that adds starts at 0, but a running **product** must start at **1**, because multiplying by 1 changes nothing.

With both fixes, for `n = 3`, `result` goes 1 → 2 → 4 → 8. For `n = 0`, the condition `1 <= 0` is false at once, the body never runs, and the starting value 1 is printed, which is exactly right.
