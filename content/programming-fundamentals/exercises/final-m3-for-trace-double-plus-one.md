---
slug: final-m3-for-trace-double-plus-one
type: trace
title: An update that doubles and adds one
lesson: for-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

The update of a `for` loop doesn't have to be `i++` or `i += 2`. Here it is `i = i * 2 + 1`. The variable `i` is declared **before** the loop, so it can still be printed after the loop ends. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int count = 0;
    int i;
    for (i = 2; i < 50; i = i * 2 + 1)
    {
        cout << i << " ";
        count++;
    }
    cout << endl;
    cout << count << " passes, i = " << i << endl;
    return 0;
}
```

## Answer

```output
2 5 11 23 47 
5 passes, i = 95
```

## Hints

- The order is: initialization once, then condition → body → update → condition → …
- In `i * 2 + 1`, the multiplication comes first. After 47, what is the next value of `i`? Does it pass the condition?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | `i = 2`; `2 < 50` TRUE | i = 2; count = 0 | |
| 9 | print 2, count | i = 2; count = 1 | |
| 7 | update: 2 × 2 + 1; `5 < 50` TRUE | i = 5; count = 1 | |
| 9 | print 5, count | i = 5; count = 2 | |
| 7 | update: 5 × 2 + 1; `11 < 50` TRUE | i = 11; count = 2 | |
| 9 | print 11, count | i = 11; count = 3 | |
| 7 | update: 11 × 2 + 1; `23 < 50` TRUE | i = 23; count = 3 | |
| 9 | print 23, count | i = 23; count = 4 | |
| 7 | update: 23 × 2 + 1; `47 < 50` TRUE | i = 47; count = 4 | |
| 9 | print 47, count | i = 47; count = 5 | |
| 7 | update: 47 × 2 + 1; `95 < 50` FALSE, the loop ends | i = 95; count = 5 | |
| 12 | end the line | i = 95; count = 5 | |
| 13 | print count and i | i = 95; count = 5 | |

## Explanation

The initialization `i = 2` runs once. After each pass the update `i = i * 2 + 1` runs (multiply first, then add 1), and then the condition is checked:

2 → 5 → 11 → 23 → 47 → 95

The values 2, 5, 11, 23 and 47 are all less than 50, so the body runs **5** times and prints each of them followed by a space, all on one line. After 47 the update makes `i` 95, and `95 < 50` is FALSE, so 95 is never printed inside the loop.

Because `i` was declared before the loop, it still exists afterwards and holds the value that stopped the loop: 95, not 47. The `cout << endl;` after the loop ends the first line, so the last line is `5 passes, i = 95`.
