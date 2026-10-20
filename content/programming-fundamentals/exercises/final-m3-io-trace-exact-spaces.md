---
slug: final-m3-io-trace-exact-spaces
type: trace
title: Every space counts on the ticket
lesson: input-and-output-with-cout-and-cin
difficulty: hard
compare: exact
reserved: true
updated: 2026-10-10
---

## Question

This program prints a bus ticket receipt. `cout` prints **exactly** the spaces that are inside the quotes, and never adds a space of its own between two values. For this question every space counts. What exactly does it print? Type one line of output per line, with the spaces exactly where the program puts them.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets = 3;
    float price = 7.5;
    cout << "Tickets:" << tickets << endl;
    cout << "Price: " << price << " LE" << endl;
    cout << tickets << " x " << price << "=" << tickets * price << endl;
    cout << "Change:" << " " << 50 - tickets * price << "LE" << endl;
    cout << "  Done" << endl;
    return 0;
}
```

## Answer

```output
Tickets:3
Price: 7.5 LE
3 x 7.5=22.5
Change: 27.5LE
  Done
```

## Hints

- Look inside every pair of quotes: is there a space at the start or at the end?
- Between two `<<` values there is no space unless a string in quotes puts one there.

## Explanation

`<<` sends the values to the screen one after another, with **nothing** added between them. Every space you see comes from inside a pair of quotes.

- Line 7: `"Tickets:"` has no space at the end, so the 3 sticks to it: `Tickets:3`.
- Line 8: `"Price: "` ends with a space and `" LE"` starts with one, so the line is `Price: 7.5 LE`.
- Line 9: `" x "` has a space on each side, but `"="` has none, so the line is `3 x 7.5=22.5`. The calculation `3 * 7.5` is printed as its result, 22.5.
- Line 10: the separate `" "` adds one space after `Change:`, and `50 - 22.5` is 27.5. `"LE"` has no space, so it sticks to the number: `Change: 27.5LE`.
- Line 11: the two spaces at the start of `"  Done"` are printed too, so the line starts with two spaces.
