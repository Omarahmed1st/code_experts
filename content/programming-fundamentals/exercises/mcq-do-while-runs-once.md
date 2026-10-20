---
slug: mcq-do-while-runs-once
type: mcq
title: A do-while whose condition is false
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-09
---

## Question

The condition `n < 20` is false from the start. What does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n = 20;
    do
    {
        cout << n << " ";
        n = n + 5;
    }
    while (n < 20);
    cout << "end" << endl;
    return 0;
}
```

## Options

- [ ] `end`
  This is what a normal `while` loop would print. A `do-while` runs its body before it checks.
- [x] `20 end`
  Right: the body runs once and prints 20, then `25 < 20` is false, so the loop stops.
- [ ] `20 25 end`
  After the first pass `n` is 25. The check `25 < 20` is false, so 25 is never printed.
- [ ] It never stops.
  `n` gets bigger each pass, and the condition is already false after the first pass, so the loop ends.

## Answer

```output
20 end
```

## Hints

- In a `do-while`, which comes first: the body or the check?
- What is `n` when the condition is checked for the first time?

## Explanation

A `do-while` loop runs the **body first** and checks the condition **after** it. So the body always runs at least once.

1. The body runs: it prints `20 ` and `n` becomes 25.
2. The check `25 < 20` is false, so the loop ends.
3. `end` is printed after the loop.

If this were a normal `while (n < 20)` loop, the check `20 < 20` would be false at the start, the body would never run, and only `end` would be printed.
