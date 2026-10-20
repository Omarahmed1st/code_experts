---
slug: final-m2-if-fix-cheaper-price-first
type: correct_code
title: Fix the cheaper price first
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads the prices of two phones and should print them in order, the **cheaper one first**. When the first price is the bigger one, the program must swap the values of `a` and `b`. For `8000 3000` it should print `3000 8000`, but it prints `8000 3000`, and for `3000 8000` it prints `8000 8000`.

It has **two** bugs: one in the condition and one in the swap. Fix them. Use the variable `temp` to save the value of `a` first, and don't add any other variable.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b, temp;
    cin >> a >> b;
    if (a < b)
    {
        a = b;
        b = a;
    }
    cout << a << " " << b << endl;
    return 0;
}
```

## Expected behavior

The user types two whole-number prices. The program prints the smaller one, a space, then the bigger one. For `8000 3000` and for `3000 8000` it prints `3000 8000`. For two equal prices, such as `5000 5000`, it prints `5000 5000`.

## Tests

### the first price is bigger

```input
8000 3000
```

```output
3000 8000
```

### already in order

```input
3000 8000
```

```output
3000 8000
```

### the same price

```input
5000 5000
```

```output
5000 5000
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b, temp;
    cin >> a >> b;
    if (a > b)
    {
        temp = a;
        a = b;
        b = temp;
    }
    cout << a << " " << b << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b, temp;
    cin >> a >> b;
    if (b < a)
    {
        temp = a;
        a = b;
        b = temp;
    }
    cout << a << " " << b << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b, temp;
    cin >> a >> b;
    if (a >= b)
    {
        temp = a;
        a = b;
        b = temp;
    }
    cout << a << " " << b << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b, temp;
    cin >> a >> b;
    if (b <= a)
    {
        temp = a;
        a = b;
        b = temp;
    }
    cout << a << " " << b << endl;
    return 0;
}
```

## Hints

- When must the values be swapped: when `a` is smaller, or when `a` is bigger?
- Trace `a = b; b = a;` with 3000 and 8000. After the first line, where is the 3000?

## Explanation

1. **The condition is the wrong way round.** The values must be swapped when the first price is the **bigger** one, so the condition is `a > b`. With `a < b`, the program swaps exactly the pairs that are already in order and leaves the wrong pairs alone.
2. **The swap loses a value.** `a = b;` copies `b` into `a`, and the old value of `a` is gone: a box holds only one value. Then `b = a;` copies that same value back, so both boxes end up holding `b`'s value. That is why `3000 8000` printed `8000 8000`. The fix is to save `a` in `temp` first: `temp = a; a = b; b = temp;`.

For equal prices nothing needs to change, so `a >= b` also works: swapping two equal values changes nothing.
