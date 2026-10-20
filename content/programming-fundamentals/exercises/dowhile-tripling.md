---
slug: dowhile-tripling
type: trace
title: Tripling with do-while
lesson: do-while-and-choosing-a-loop
difficulty: easy
updated: 2026-10-10
---

## Question

Trace this `do-while` loop by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 1;
    do
    {
        cout << n << endl;
        n = n * 3;
    }
    while (n < 50);
    cout << "n = " << n << endl;
    return 0;
}
```

## Answer

```output
1
3
9
27
n = 81
```

## Hints

- In each pass, `n` is printed first and multiplied by 3 after that. The check comes at the end.
- When `n` becomes 81, is `81 < 50` true? Is 81 printed inside the loop?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `n` starts at 1 | n = 1 | |
| 8 | the body runs first: print 1 | n = 1 | 1\n |
| 9 | `n = 1 * 3` | n = 3 | |
| 11 | `3 < 50` is true: run the body again | n = 3 | |
| 8 | print 3 | n = 3 | 3\n |
| 9 | `n = 3 * 3` | n = 9 | |
| 11 | `9 < 50` is true | n = 9 | |
| 8 | print 9 | n = 9 | 9\n |
| 9 | `n = 9 * 3` | n = 27 | |
| 11 | `27 < 50` is true | n = 27 | |
| 8 | print 27 | n = 27 | 27\n |
| 9 | `n = 27 * 3` | n = 81 | |
| 11 | `81 < 50` is false: the loop ends | n = 81 | |
| 12 | print the final value after the loop | n = 81 | n = 81\n |

## Explanation

A `do-while` loop runs the body **first** and checks the condition at the **end** of each pass. Here the body prints `n` and then triples it.

So the values printed inside the loop are 1, 3, 9 and 27. After 27 is printed, `n` becomes 81, and the check `81 < 50` is false, so the loop stops. 81 is never printed inside the loop, because the check happens before the next pass. It is printed only by the line after the loop: `n = 81`.
