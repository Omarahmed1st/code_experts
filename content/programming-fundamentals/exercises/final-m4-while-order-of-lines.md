---
slug: final-m4-while-order-of-lines
type: mcq
title: The order the lines run in
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Number the lines of the program from 1 (`#include <iostream>`) to 13 (the last `}`), so line 5 is `int count = 3;` and line 6 is the `while` line. When this program runs, the lines inside `main` run in a certain order. Which list gives the line numbers of the statements that run, **in the order they run**, from line 5 until `Done` is printed? (Braces `{ }` are not counted.)

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int count = 3;
    while (count <= 4)
    {
        cout << count << endl;
        count++;
    }
    cout << "Done" << endl;
    return 0;
}
```

## Options

- [x] 5, 6, 8, 9, 6, 8, 9, 6, 11
  Right: the initialization runs once, then the condition (line 6) is checked before every pass: TRUE for 3, TRUE for 4, and FALSE for 5. After the third check the program continues after the `}` with line 11.
- [ ] 5, 6, 8, 9, 8, 9, 11
  This checks the condition only once. A `while` loop checks it again before **every** pass, so line 6 must appear between the passes and once more at the end.
- [ ] 5, 6, 8, 9, 5, 6, 8, 9, 6, 11
  After the body, the program jumps back to the **condition** (line 6), not to line 5. The initialization `int count = 3;` runs only once; otherwise `count` would go back to 3 and the loop would never end.
- [ ] 5, 6, 8, 9, 6, 8, 9, 11
  This misses the last check. After the second pass `count` is 5, and the loop can only stop by checking `5 <= 4` on line 6 and finding it FALSE.

## Hints

- Make a trace with one column for `count`. Each time the program reaches line 6, write down the check and its answer.
- Where does the flow go after line 9: to line 5, or to line 6?

## Explanation

A `while` loop runs in this cycle: **condition**, **body**, back to the **condition**, until the condition is FALSE.

| Step | Line | What happens | count |
|---|---|---|---|
| 1 | 5 | initialization, once | 3 |
| 2 | 6 | `3 <= 4` TRUE | 3 |
| 3 | 8, 9 | print 3, then `count++` | 4 |
| 4 | 6 | `4 <= 4` TRUE | 4 |
| 5 | 8, 9 | print 4, then `count++` | 5 |
| 6 | 6 | `5 <= 4` FALSE: leave the loop | 5 |
| 7 | 11 | print `Done` | 5 |

So the order is 5, 6, 8, 9, 6, 8, 9, 6, 11. The body runs **2** times, but line 6 runs **3** times: the last check is the one that stops the loop. And the arrow after the body always goes back to the condition, never to the initialization.
