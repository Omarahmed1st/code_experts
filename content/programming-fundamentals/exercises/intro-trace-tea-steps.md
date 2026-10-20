---
slug: intro-trace-tea-steps
type: trace
title: Printing steps in order
lesson: what-is-programming
difficulty: medium
updated: 2026-10-10
---

## Question

Trace this program by hand. What exactly does it print? Type each line of output on its own line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    cout << "Boil water" << endl;
    cout << "Add tea ";
    cout << "and sugar" << endl;
    cout << "Ready!" << endl;
    return 0;
}
```

## Answer

```output
Boil water
Add tea and sugar
Ready!
```

## Hints

- The program runs the `cout` lines from top to bottom, one after another.
- `endl` moves to a new line. Which `cout` line has no `endl`?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | print `Boil water`, then `endl` moves to a new line | | Boil water\n |
| 6 | print `Add tea ` with no `endl`, so we stay on the same line | | `Add tea ` |
| 7 | print `and sugar` on the same line, then move to a new line | | and sugar\n |
| 8 | print `Ready!`, then move to a new line | | Ready!\n |
| 9 | `return 0;` the program finishes | | |

## Explanation

A program follows its steps exactly, in the order they are written, so the lines are printed from top to bottom.

`endl` is what moves the output to a new line. Line 6 prints `Add tea ` (with a space at the end) but has no `endl`, so the next `cout` on line 7 continues on the **same** line. That is why the second line of output is `Add tea and sugar`. There are only three lines of output, not four.
