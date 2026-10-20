---
slug: final-m2-for-trace-tally-marks
type: trace
title: Counting votes with tally marks
lesson: for-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A class votes for a trip, and the teacher draws the 13 votes as tally marks: four straight marks, then the fifth mark crosses the group. The `for` loop draws one mark per vote, all on one line. Trace the program by hand. What exactly does it print? Type one line of output per line, with the spaces exactly where the program prints them.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int votes = 13;
    int groups = 0;
    for (int i = 1; i <= votes; i++)
    {
        if (i % 5 == 0)
        {
            cout << "/ ";
            groups++;
        }
        else
        {
            cout << "|";
        }
    }
    cout << endl;
    cout << groups << " groups and " << votes % 5 << " more" << endl;
    return 0;
}
```

## Answer

```output
||||/ ||||/ |||
2 groups and 3 more
```

## Hints

- For which values of `i` from 1 to 13 is `i % 5 == 0`? Those passes print `/ ` instead of `|`.
- None of the `cout` lines in the loop has an `endl`. Where does the first line end?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 16 | i = 1 to 4: `i % 5` is not 0, so each pass prints one mark | groups = 0 | |
| 11 | i = 5: `5 % 5 == 0`, print the cross and a space | i = 5; groups = 1 | |
| 16 | i = 6 to 9: four more marks | groups = 1 | |
| 11 | i = 10: `10 % 5 == 0`, print the cross and a space | i = 10; groups = 2 | |
| 16 | i = 11 to 13: three more marks | groups = 2 | |
| 7 | i = 14: `14 <= 13` is FALSE, the loop ends | groups = 2 | |
| 19 | end the first line | groups = 2 | |
| 20 | `13 % 5` is 3, print the summary | groups = 2 | |

## Explanation

The loop runs 13 times, once per vote (`i` = 1 to 13). In each pass the decision is made again:

- When `i` is a multiple of 5 (5 and 10), `i % 5 == 0` is TRUE: the pass prints `/ ` (a cross and a space) and counts a group.
- In every other pass it prints a single `|`.

So the marks come out as `||||` (votes 1 to 4), `/ ` (vote 5), `||||` (votes 6 to 9), `/ ` (vote 10), `|||` (votes 11 to 13). The fifth vote of each group is the `/` itself, not an extra `|`. Nothing in the loop ends the line, so all of it is on one line, and the `endl` on line 19 ends it after the last mark.

After the loop, `groups` is 2, and `13 % 5` is 3: two full groups of 5 and 3 votes more.
