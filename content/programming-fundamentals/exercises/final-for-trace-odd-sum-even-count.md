---
slug: final-for-trace-odd-sum-even-count
type: trace
title: Counting down in threes, odd or even
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This `for` loop counts down in threes and makes a decision in every pass. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int evens = 0;
    int oddSum = 0;
    for (int i = 15; i >= 3; i -= 3)
    {
        if (i % 2 == 0)
        {
            evens++;
        }
        else
        {
            oddSum += i;
            cout << i << ": " << oddSum << endl;
        }
    }
    cout << "Evens: " << evens << endl;
    return 0;
}
```

## Answer

```output
15: 15
9: 24
3: 27
Evens: 2
```

## Hints

- Write down every value of `i` first: 15, then 3 less each time. Which value makes `i >= 3` FALSE?
- Only the **odd** values print a line. The even values are only counted.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | the counter and the accumulator start at 0 | evens = 0; oddSum = 0 | |
| 7 | `i = 15`; `15 >= 3` TRUE | i = 15; evens = 0; oddSum = 0 | |
| 15 | 15 is odd: `oddSum += 15`, print | i = 15; evens = 0; oddSum = 15 | 15: 15\n |
| 7 | `i -= 3`; `12 >= 3` TRUE | i = 12; evens = 0; oddSum = 15 | |
| 11 | 12 is even: `evens++` | i = 12; evens = 1; oddSum = 15 | |
| 7 | `i -= 3`; `9 >= 3` TRUE | i = 9; evens = 1; oddSum = 15 | |
| 15 | 9 is odd: `oddSum += 9`, print | i = 9; evens = 1; oddSum = 24 | 9: 24\n |
| 7 | `i -= 3`; `6 >= 3` TRUE | i = 6; evens = 1; oddSum = 24 | |
| 11 | 6 is even: `evens++` | i = 6; evens = 2; oddSum = 24 | |
| 7 | `i -= 3`; `3 >= 3` TRUE | i = 3; evens = 2; oddSum = 24 | |
| 15 | 3 is odd: `oddSum += 3`, print | i = 3; evens = 2; oddSum = 27 | 3: 27\n |
| 7 | `i -= 3`; `0 >= 3` FALSE, the loop ends | i = 0; evens = 2; oddSum = 27 | |
| 19 | print evens | evens = 2; oddSum = 27 | Evens: 2\n |

## Explanation

The loop starts high (`i = 15`), stops after 3 (`i >= 3`) and goes down by 3 (`i -= 3`), so `i` takes the values 15, 12, 9, 6 and 3. Then `i` becomes 0, and `0 >= 3` is FALSE. Because of the `>=`, the value 3 is included.

The `if` / `else` is inside the loop, so it decides again for each value. The odd values (15, 9, 3) go to the `else` path: each one is added to the accumulator `oddSum` (15, then 24, then 27) and a line is printed with the **new** total. The even values (12, 6) go to the `if` path, which only adds 1 to the counter `evens`.

The last line is after the loop, so it runs once and prints the final count, 2.
