---
slug: io-where-lines-break
type: trace
title: Where do the lines break?
lesson: input-and-output-with-cout-and-cin
difficulty: easy
updated: 2026-10-10
---

## Question

This program has five `cout` statements, but not all of them end with `endl`. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    cout << "Total: ";
    cout << 3 + 4 << endl;
    cout << "Done";
    cout << " now" << "!" << endl;
    cout << "Bye" << endl;
    return 0;
}
```

## Answer

```output
Total: 7
Done now!
Bye
```

## Hints

- `cout` never starts a new line on its own. Only `endl` (or `\n`) does.
- `3 + 4` is not in quotes, so it is calculated before it is printed.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | print the text; no `endl`, so the line continues | | `Total: ` |
| 6 | calculate `3 + 4` and print 7, then end the line | | 7\n |
| 7 | print `Done`; no `endl` | | Done |
| 8 | print ` now` and `!` on the same line, then end it | | ` now!\n` |
| 9 | print `Bye` and end the line | | Bye\n |

## Explanation

There are five `cout` statements but only **three** lines of output, because only three statements contain `endl`.

- Line 5 prints `Total: ` (with the space at the end) and stays on the same line, so line 6 prints `7` right after it.
- `3 + 4` has no quotes, so C++ calculates it and prints the value `7`. With quotes, `"3 + 4"` would print the text as written.
- Line 7 prints `Done` with no `endl`, so ` now!` from line 8 joins it. The space comes from inside the string `" now"`.

A new `cout` statement does **not** mean a new line. Only `endl` or `\n` moves to the next line.
