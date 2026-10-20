---
slug: final-dowhile-trace-three-loops
type: trace
title: One condition, three loops
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

All three loops below use the same condition and the same update, but they are not the same kind of loop, and each one starts from where the last one stopped. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 9;
    do
    {
        cout << a << " ";
        a -= 4;
    }
    while (a > 1);
    cout << "| " << a << endl;

    int b = a;
    while (b > 1)
    {
        cout << b << " ";
        b -= 4;
    }
    cout << "| " << b << endl;

    do
    {
        cout << b << " ";
        b -= 4;
    }
    while (b > 1);
    cout << "| " << b << endl;
    return 0;
}
```

## Answer

```output
9 5 | 1
| 1
1 | -3
```

## Hints

- A `do-while` runs the body first and checks after. A `while` checks first, so its body can run zero times.
- Keep track of the value each loop leaves behind: the next loop starts from it.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `a` starts at 9 | a = 9 | |
| 8 | do-while body: print `9 `, then `a -= 4` | a = 5 | |
| 11 | `5 > 1` TRUE, go back | a = 5 | |
| 8 | print `5 `, then `a -= 4` | a = 1 | |
| 11 | `1 > 1` FALSE, the loop ends | a = 1 | |
| 12 | print the bar and a: the line is `9 5 \| 1` | a = 1 | 9 5 \| 1\n |
| 14 | `b` gets the value of a | a = 1; b = 1 | |
| 15 | `1 > 1` FALSE: the while body is skipped | b = 1 | |
| 20 | print the bar and b | b = 1 | \| 1\n |
| 24 | do-while body runs first: print `1 `, then `b -= 4` | b = -3 | |
| 27 | `-3 > 1` FALSE, the loop ends | b = -3 | |
| 28 | print the bar and b: the line is `1 \| -3` | b = -3 | 1 \| -3\n |

## Explanation

The first loop is a `do-while`. It prints 9 and 5, and after the second pass `a` is 1, so `1 > 1` is FALSE and it stops: `9 5 | 1`.

The second loop is a `while` starting at `b = 1`. It checks **first**: `1 > 1` is FALSE, so its body runs **zero** times. Only the bar and the value are printed: `| 1`.

The third loop is a `do-while` with the same FALSE condition, but it runs the body **before** checking. So it prints 1, changes `b` to 1 − 4 = −3, and only then finds `-3 > 1` FALSE: `1 | -3`. This is the key difference: a `do-while` body always runs at least once, while a `while` body can be skipped completely.
