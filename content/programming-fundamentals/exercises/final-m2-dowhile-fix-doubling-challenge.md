---
slug: final-m2-dowhile-fix-doubling-challenge
type: correct_code
title: Fix the doubling challenge
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

In a savings challenge, Nour starts with some money and doubles it every month. The program reads the starting amount and should print it, then keep doubling and printing each new amount **while it is below 1000**. The starting amount is **always** printed, even if it is already 1000 or more, so a `do-while` is the right loop.

For `50` it should print 50, 100, 200, 400 and 800, but it prints 100, 200, 400, 800 and 1600. The loop body and the condition each have **one** bug. Fix them. Keep the `do-while` loop and the line `money = money * 2;`.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money;
    cin >> money;
    do
    {
        money = money * 2;
        cout << money << endl;
    }
    while (money <= 1000);
    return 0;
}
```

## Expected behavior

The user types a whole-number amount (1 or more). The program prints the amount, then doubles it and prints each new amount as long as it is below 1000. Every amount goes on its own line. For `50` it prints 50, 100, 200, 400, 800. For `125` it prints 125, 250, 500 (1000 is not below 1000). For `1500` it prints only 1500.

## Tests

### starting at 50

```input
50
```

```output
50
100
200
400
800
```

### reaching exactly 1000

```input
125
```

```output
125
250
500
```

### already 1000 or more

```input
1500
```

```output
1500
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money;
    cin >> money;
    do
    {
        cout << money << endl;
        money = money * 2;
    }
    while (money < 1000);
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money;
    cin >> money;
    do
    {
        cout << money << endl;
        money = money * 2;
    }
    while (money <= 999);
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money;
    cin >> money;
    do
    {
        cout << money << endl;
        money = money * 2;
    }
    while (1000 > money);
    return 0;
}
```

## Hints

- Which amount must be printed first? Does the body print it before or after doubling?
- With the order fixed, trace `125`: after 500 the money becomes 1000. Is 1000 "below 1000"? Should it be printed?

## Explanation

1. **The order inside the body.** The starting amount must be printed first, so the `cout` has to come **before** the doubling. With the doubling first, the first number printed is already twice the starting amount, and the last one printed is the amount that has gone past the limit (1600).
2. **The boundary in the condition.** After printing, the money is doubled, and the condition decides whether the **new** amount gets printed in the next pass. Only amounts below 1000 should be printed, so the condition is `money < 1000`. With `<=`, a value of exactly 1000 would be printed too: for `125` the output would end with an extra `1000`.

The `do-while` itself is right here: it prints the starting amount even when it is already 1500, because the body runs once before the first check. A `while` loop would print nothing for `1500`.
