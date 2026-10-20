---
slug: final-m4-io-what-the-screen-shows
type: mcq
title: What the screen shows
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

The user runs this program, types `3 4` and presses Enter. What does the terminal screen look like at the end, **including** what the user typed? (`/` separates the lines of the screen in the options.)

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a, b;
    cout << "Enter two numbers:" << endl;
    cin >> a >> b;
    cout << "Sum: " << a + b;
    cout << "Product: " << a * b << endl;
    return 0;
}
```

## Options

- [x] `Enter two numbers:` / `3 4` / `Sum: 7Product: 12`
  Right: the prompt ends with `endl`, so the typing appears on the next line. Pressing Enter moves to a new line. Line 8 has no `endl`, so `Product: 12` is printed right after `Sum: 7` on the same line.
- [ ] `Enter two numbers: 3 4` / `Sum: 7Product: 12`
  The typing would appear on the prompt's line only if the prompt had no `endl`. Here `endl` already ended that line before `cin` waited for the numbers.
- [ ] `Enter two numbers:` / `3 4` / `Sum: 7` / `Product: 12`
  `cout` never starts a new line on its own. Line 8 doesn't end with `endl`, so line 9 carries on in the same line.
- [ ] `Enter two numbers:` / `Sum: 7Product: 12`
  The screen also shows what the user types, as they type it. `cin` prints nothing itself, but the `3 4` the user typed stays on the screen.

## Hints

- Remember the lecture's OUTPUT boxes: the user's typing appears on the screen, and Enter ends that line.
- Look at the end of every `cout` statement: does it have `endl` or not?

## Explanation

The terminal shows two kinds of text: what the **program prints** with `cout`, and what the **user types**, which appears as it is typed.

1. Line 6 prints `Enter two numbers:` and `endl` ends that line.
2. Line 7 waits. The user types `3 4`, which appears on the new line, and presses Enter, which moves to the next line. `cin` stores 3 in `a` and 4 in `b`; it prints nothing itself.
3. Line 8 prints `Sum: 7` with **no** `endl`, so the line stays open.
4. Line 9 prints `Product: 12` straight after it, then `endl`.

So the screen is:

```output
Enter two numbers:
3 4
Sum: 7Product: 12
```

To put the two results on separate lines, line 8 needs `<< endl` (or `"\n"`) at the end.
