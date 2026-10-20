---
slug: final-b-io-tricky-line-breaks
type: trace
title: Where do the lines really break?
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program mixes `endl`, `"\n"` and `cout` statements with no line break at all. Some values are printed with no space between them. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 7;
    int b = 2;
    cout << a << b << endl;
    cout << a / b << "." << a % b << "\n";
    cout << "Sum:" << a + b;
    cout << "\nHalf: " << a / 2.0 << endl;
    cout << "A" << "B\n" << "C" << endl;
    return 0;
}
```

## Answer

```output
72
3.1
Sum:9
Half: 3.5
AB
C
```

## Hints

- `cout` never adds spaces or new lines by itself. Only `endl` and `\n` start a new line.
- On line 8, `"."` is just text. What are `7 / 2` and `7 % 2` for two `int` values?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `a` starts at 7 | a = 7 | |
| 6 | `b` starts at 2 | a = 7; b = 2 | |
| 7 | print 7, then 2, with nothing between, then end the line | a = 7; b = 2 | 72\n |
| 8 | `7 / 2` is 3, then the text ".", then `7 % 2` is 1 | a = 7; b = 2 | 3.1\n |
| 9 | print "Sum:" and 9; no line break | a = 7; b = 2 | Sum:9 |
| 10 | `\n` ends the Sum line first; `7 / 2.0` is 3.5 | a = 7; b = 2 | \nHalf: 3.5\n |
| 11 | "A", then "B" and a line break, then "C" | a = 7; b = 2 | AB\nC\n |

## Explanation

`cout` prints exactly what it is given, in order, and nothing else. It adds no spaces and no line breaks of its own.

- Line 7 prints the value 7 and then the value 2 with nothing between them, so it looks like the number `72`.
- Line 8 looks like a decimal, but it is not: `7 / 2` is `int / int`, which gives 3, then the text `"."` is printed, then `7 % 2` gives the remainder 1. The result is `3.1`, which has nothing to do with 3.5.
- Line 9 has no `endl`, so the next output continues on the same line. But line 10 **starts** with `\n`, which ends that line before `Half:` is printed. `7 / 2.0` uses a decimal number, so it gives 3.5.
- On line 11, `"B\n"` contains a line break, so `C` starts a new line.
