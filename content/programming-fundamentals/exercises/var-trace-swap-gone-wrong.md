---
slug: var-trace-swap-gone-wrong
type: trace
title: Trying to swap two values
lesson: variables-named-boxes-in-memory
difficulty: medium
updated: 2026-10-10
---

## Question

A student wants to swap the values of `a` and `b`, so that `a` holds 8 and `b` holds 5. Trace the program by hand. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 5;
    int b = 8;
    a = b;
    b = a;
    cout << a << endl;
    cout << b << endl;
    return 0;
}
```

## Answer

```output
8
8
```

## Hints

- After line 7, what is in `a`? Is the 5 still anywhere in memory?
- On line 8, `b` gets the value that is in `a` **now**, not the value `a` had at the start.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | create `a`, store 5 | a = 5 | |
| 6 | create `b`, store 8 | a = 5; b = 8 | |
| 7 | the value of `b` (8) replaces 5 in `a` | a = 8; b = 8 | |
| 8 | the value of `a` (now 8) is stored in `b` | a = 8; b = 8 | |
| 9 | print `a` | a = 8; b = 8 | 8\n |
| 10 | print `b` | a = 8; b = 8 | 8\n |

## Explanation

A variable holds **one value at a time**. When line 7 stores 8 in `a`, the old value 5 is replaced and gone. No box holds 5 any more.

Line 8 then copies the value that is in `a` **now**, which is 8, into `b`. So both variables end up holding 8, and the swap fails.

To swap two values you need a third box to keep one of them safe first, for example: `int temp = a;` then `a = b;` then `b = temp;`.
