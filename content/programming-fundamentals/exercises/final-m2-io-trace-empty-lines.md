---
slug: final-m2-io-trace-empty-lines
type: trace
title: Where are the empty lines?
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This metro receipt uses `endl` and `"\n"` several times in a row. Every `endl` or `\n` ends the current line, so two of them in a row leave an **empty line**. Trace the program by hand. What exactly does it print? Type one line of output per line, and leave a line empty where the program prints an empty line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets = 4;
    double price = 7.5;
    cout << "Metro" << endl << endl;
    cout << "Tickets: " << tickets;
    cout << endl;
    cout << endl << "Cost: " << tickets * price << "\n\n";
    cout << "\nThank you" << endl;
    return 0;
}
```

## Answer

```output
Metro

Tickets: 4

Cost: 30


Thank you
```

## Hints

- Count the line breaks: each `endl` and each `\n` is one. The first one after some text ends that text's line; every extra one makes an empty line.
- Line 8 has no line break at the end. Where does line 9's `endl` go?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | `Metro`, then two line breaks: the second makes an empty line | tickets = 4; price = 7.5 | Metro\n\n |
| 8 | no line break: the line stays open | tickets = 4; price = 7.5 | Tickets: 4 |
| 9 | ends the `Tickets` line | tickets = 4; price = 7.5 | \n |
| 10 | an empty line, then `Cost: 30` and two `\n` | tickets = 4; price = 7.5 | \nCost: 30\n\n |
| 11 | `\n` first: another empty line, then `Thank you` | tickets = 4; price = 7.5 | \nThank you\n |

## Explanation

`endl` and `\n` do the same job: they end the current line. Text after them starts on a new line. So a line break **right after another one** leaves an empty line.

- **Line 7** prints `Metro` and ends the line; the second `endl` leaves an empty line.
- **Line 8** prints `Tickets: 4` with no line break, and **line 9**'s `endl` ends that line. So far no empty line here.
- **Line 10** starts with `endl`, but the line is already ended, so this makes an empty line. Then it prints `Cost: 30` (4 × 7.5 = 30, and `cout` doesn't print `.0`), and `"\n\n"` ends that line and leaves one empty line.
- **Line 11** starts with `\n`, which leaves a **second** empty line, then prints `Thank you`.

So there is one empty line after `Metro`, one after `Tickets: 4`, and two after `Cost: 30`.
