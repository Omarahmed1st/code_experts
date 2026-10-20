---
slug: dowhile-vs-while-passes
type: trace
title: Counting the passes of while and do-while
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-10
---

## Question

Both loops start with `x = 5` and use the same condition, `x < 5`. Each one counts its passes in `count`. What exactly does the program print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int count = 0;
    int x = 5;
    while (x < 5)
    {
        count++;
        x++;
    }
    cout << "while: " << count << endl;
    count = 0;
    x = 5;
    do
    {
        count++;
        x++;
    }
    while (x < 5);
    cout << "do-while: " << count << endl;
    return 0;
}
```

## Answer

```output
while: 0
do-while: 1
```

## Hints

- For each loop, ask: is the condition checked **before** or **after** the body?
- `5 < 5` is false. What does each loop do with a condition that is false from the start?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `count` starts at 0 | count = 0 | |
| 6 | `x` starts at 5 | count = 0; x = 5 | |
| 7 | `5 < 5` is false: the while body is skipped | count = 0; x = 5 | |
| 12 | print the count of the while loop | count = 0; x = 5 | while: 0\n |
| 13 | reset `count` | count = 0; x = 5 | |
| 14 | reset `x` | count = 0; x = 5 | |
| 17 | the do-while body runs first: `count++` | count = 1; x = 5 | |
| 18 | `x++` | count = 1; x = 6 | |
| 20 | `6 < 5` is false: the loop ends | count = 1; x = 6 | |
| 21 | print the count of the do-while loop | count = 1; x = 6 | do-while: 1\n |

## Explanation

Same starting value, same condition, different result:

- The `while` loop checks `5 < 5` **before** the body. It is false, so the body never runs and `count` stays 0. A `while` body can run **0** times.
- The `do-while` loop runs the body **first**: `count` becomes 1 and `x` becomes 6. Only then does it check `6 < 5`, which is false, so it stops. A `do-while` body always runs **at least once**.

This is the one real difference between the two loops: where the condition is checked.
