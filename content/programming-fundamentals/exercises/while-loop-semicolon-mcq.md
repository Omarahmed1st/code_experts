---
slug: while-semicolon-after-condition
type: mcq
title: A semicolon after while ( )
lesson: while-loops-in-cpp
difficulty: easy
updated: 2026-10-09
---

## Question

What happens when this program runs?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    while (counter <= 3);
    {
        cout << counter << endl;
        counter++;
    }
    return 0;
}
```

## Options

- [ ] It prints 1, 2 and 3 on separate lines.
  The braces look like the loop's body, but the `;` already ended the loop.
- [ ] It prints 1 once and stops.
  Nothing is printed: the program never gets past the `while` line.
- [x] It prints nothing and never finishes.
  Right: `while (counter <= 3);` is a loop with an empty body, and `counter` never changes.
- [ ] It doesn't compile.
  It compiles: an empty statement `;` is a legal loop body. That's why this mistake is hard to spot.

## Hints

- Where does the loop's body end? Look at the end of the `while` line.
- Inside the loop, does anything change `counter`?

## Explanation

The semicolon right after `while (counter <= 3)` **is** the loop's body: an empty statement. The loop checks `1 <= 3`, does nothing, checks again, and so on forever, because nothing inside the loop changes `counter`. The block in braces below it is not part of the loop; it would only run after the loop ends, which never happens.

Never put a semicolon after `while ( )`.
