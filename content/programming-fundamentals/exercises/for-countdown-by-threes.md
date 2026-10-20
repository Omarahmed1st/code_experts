---
slug: for-countdown-by-threes
type: trace
title: Counting down in threes
lesson: for-loops
difficulty: easy
updated: 2026-10-10
---

## Question

Trace this `for` loop by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int i = 10; i >= 1; i -= 3)
    {
        cout << i << endl;
    }
    cout << "Go!" << endl;
    return 0;
}
```

## Answer

```output
10
7
4
1
Go!
```

## Hints

- Start high at 10, then take away 3 after each pass.
- Is `1 >= 1` true? What about the next value after 1?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `i` starts at 10; `10 >= 1` is true | i = 10 | |
| 7 | print 10 | i = 10 | 10\n |
| 5 | `i -= 3`; `7 >= 1` is true | i = 7 | |
| 7 | print 7 | i = 7 | 7\n |
| 5 | `i -= 3`; `4 >= 1` is true | i = 4 | |
| 7 | print 4 | i = 4 | 4\n |
| 5 | `i -= 3`; `1 >= 1` is true | i = 1 | |
| 7 | print 1 | i = 1 | 1\n |
| 5 | `i -= 3`; `-2 >= 1` is false, so the loop ends | i = -2 | |
| 9 | print Go! after the loop | | Go!\n |

## Explanation

This loop counts **down**, so all three parts work together: it starts high (`int i = 10`), keeps going while `i >= 1`, and goes down by 3 each time (`i -= 3`).

`i` takes the values 10, 7, 4 and 1, and each one is printed. 1 is printed because `1 >= 1` is true (the `=` includes 1). After that, `i` becomes -2, and `-2 >= 1` is false, so the loop stops. -2 is never printed. `Go!` is outside the loop's braces, so it runs once, after the loop.
