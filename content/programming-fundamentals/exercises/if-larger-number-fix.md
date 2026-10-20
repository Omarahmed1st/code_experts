---
slug: if-larger-number-fix
type: correct_code
title: Fix the larger number
lesson: decisions-if-then-else
difficulty: easy
updated: 2026-10-10
---

## Question

This program should read two numbers A and B and print the **larger** one. For `17 42` it prints `Larger: 17`, which is wrong. Find the bug and fix it.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int A, B;
    cin >> A >> B;
    if (A < B)
    {
        cout << "Larger: " << A << endl;
    }
    else
    {
        cout << "Larger: " << B << endl;
    }
    return 0;
}
```

## Expected behavior

The user types two whole numbers. The program prints `Larger: ` followed by the larger of the two. For `17 42` it prints `Larger: 42`. When both numbers are equal, it prints that number.

## Tests

### the second number is larger

```input
17 42
```

```output
Larger: 42
```

### the first number is larger

```input
50 8
```

```output
Larger: 50
```

### both numbers are equal

```input
9 9
```

```output
Larger: 9
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int A, B;
    cin >> A >> B;
    if (A > B)
    {
        cout << "Larger: " << A << endl;
    }
    else
    {
        cout << "Larger: " << B << endl;
    }
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int A, B;
    cin >> A >> B;
    if (A >= B)
    {
        cout << "Larger: " << A << endl;
    }
    else
    {
        cout << "Larger: " << B << endl;
    }
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int A, B;
    cin >> A >> B;
    if (A < B)
    {
        cout << "Larger: " << B << endl;
    }
    else
    {
        cout << "Larger: " << A << endl;
    }
    return 0;
}
```

## Hints

- Trace the program with A = 17 and B = 42. Is `17 < 42` TRUE or FALSE? Which path runs?
- The TRUE path prints A. When should A be printed?

## Explanation

The TRUE path prints `A`, so the condition must be TRUE exactly when **A is the larger number**: `A > B`. The broken condition `A < B` is TRUE when A is the **smaller** one, so the program always printed the smaller number.

With `A > B`: for 17 and 42, `17 > 42` is FALSE, so B (42) is printed. For 9 and 9, `9 > 9` is FALSE and B is printed, which is still correct because both values are equal. You could also keep `A < B` and swap what the two paths print; both fixes give the same results.
