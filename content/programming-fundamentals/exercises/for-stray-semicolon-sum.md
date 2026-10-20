---
slug: for-stray-semicolon-sum
type: trace
title: A semicolon after the for header
lesson: for-loops
difficulty: hard
updated: 2026-10-10
---

## Question

The programmer wanted to add up 1 + 2 + 3 + 4. Look closely at the end of line 7. What exactly does this program print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sum = 0;
    int i;
    for (i = 1; i <= 4; i++);
    {
        sum += i;
        cout << "i = " << i << endl;
    }
    cout << "sum = " << sum << endl;
    return 0;
}
```

## Answer

```output
i = 5
sum = 5
```

## Hints

- A `;` right after `for ( … )` ends the loop there. What is left inside the loop?
- The block in braces runs after the loop has finished. What is `i` then?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `sum` starts at 0 | sum = 0 | |
| 7 | `i` starts at 1; the loop body is only the `;`, so nothing happens | sum = 0; i = 1 | |
| 7 | `i` goes 2, 3, 4, then 5; `5 <= 4` is false, so the loop ends | sum = 0; i = 5 | |
| 9 | the block runs once: `sum += 5` | sum = 5; i = 5 | |
| 10 | print `i` | sum = 5; i = 5 | i = 5\n |
| 12 | print `sum` | sum = 5; i = 5 | sum = 5\n |

## Explanation

The semicolon at the end of line 7 is the **whole body** of the loop: an empty statement. So the loop repeats nothing. It only counts `i` up from 1 until `i <= 4` becomes false, when `i` is **5**.

The block in braces is no longer part of the loop. It runs **once**, after the loop has finished, with `i = 5`. So `sum` becomes 0 + 5 = 5, and the program prints `i = 5` and `sum = 5`, not the expected 10.

The fix is to delete the `;` after the `for ( … )`. Compiling with warnings turned on (`g++ -Wall`) catches this mistake: g++ warns that the `for` clause does not guard the block below it.
