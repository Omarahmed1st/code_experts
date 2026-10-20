---
slug: write-even-numbers-up-to-n
type: write_code
title: Print the even numbers up to n
lesson: while-loops-in-cpp
difficulty: easy
updated: 2026-10-09
---

## Question

Write a program that reads a whole number `n` and prints every even number from 2 up to `n`, one per line, using a `while` loop.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    // your loop here

    return 0;
}
```

## Expected behavior

For `n = 9` the program prints 2, 4, 6 and 8, each on its own line. For `n = 1` it prints nothing.

## Tests

### n is 9

```input
9
```

```output
2
4
6
8
```

### n is 10 (10 itself is printed)

```input
10
```

```output
2
4
6
8
10
```

### n is 1 (nothing to print)

```input
1
```

```output
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int even = 2;
    while (even <= n)
    {
        cout << even << endl;
        even += 2;
    }
    return 0;
}
```

## Hints

- Start a counter at 2. What should the update be so it only visits even numbers?
- Should the condition be `<` or `<=`? Try n = 10.

## Explanation

Start at the first even number, 2, and count in steps of 2 with `even += 2`, so the loop only ever visits even numbers. The condition `even <= n` includes `n` itself when it is even (n = 10 prints 10) and stops before going past it. When `n` is 1, the condition `2 <= 1` is false at the very first check, so the body never runs and nothing is printed.

Another correct way is to count `i` from 1 to `n` and print only when `i % 2 == 0`.
