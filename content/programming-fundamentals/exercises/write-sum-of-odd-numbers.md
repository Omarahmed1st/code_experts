---
slug: write-sum-of-odd-numbers
type: write_code
title: Add up the odd numbers up to n
lesson: for-loops
difficulty: medium
updated: 2026-10-09
---

## Question

Write a program that reads a whole number `n` and prints the sum of all the **odd** numbers from 1 up to `n`, using a `for` loop. For `n = 9` the sum is 1 + 3 + 5 + 7 + 9 = 25.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    // your for loop here

    return 0;
}
```

## Expected behavior

The user types a whole number `n` (0 or more). The program prints `Sum = ` followed by the sum of the odd numbers from 1 to `n`. If `n` is odd, `n` itself is included. If there are no odd numbers (`n` is 0), it prints `Sum = 0`.

## Tests

### n is 9 (9 is included)

```input
9
```

```output
Sum = 25
```

### n is 10 (10 is even, so the sum is the same as for 9)

```input
10
```

```output
Sum = 25
```

### n is 1

```input
1
```

```output
Sum = 1
```

### n is 0 (no odd numbers at all)

```input
0
```

```output
Sum = 0
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
    for (int i = 1; i <= n; i += 2)
    {
        sum += i;
    }
    cout << "Sum = " << sum << endl;
    return 0;
}
```

## Hints

- You need an accumulator. Where must it be declared, and what is its starting value?
- Start the loop at 1, the first odd number. What update visits only odd numbers?
- Should the condition be `<` or `<=`? Test it with n = 9.

## Explanation

Three parts work together:

1. **An accumulator** `int sum = 0;` declared **before** the loop, so it keeps its value between passes.
2. **A loop that only visits odd numbers:** start at 1 and jump by 2 with `i += 2`, so `i` goes 1, 3, 5, 7, 9, … The condition `i <= n` includes `n` itself when it is odd.
3. **One `cout` after the loop**, so only the final total is printed.

For n = 0, the check `1 <= 0` is false straight away, the body never runs, and `sum` stays 0, which is the right answer.

Another correct way: loop `i` from 1 to `n` with `i++`, and add `i` only when `i % 2 == 1`. It does twice as many passes but gives the same result.
