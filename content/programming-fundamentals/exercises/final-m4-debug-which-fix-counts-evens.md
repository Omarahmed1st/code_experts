---
slug: final-m4-debug-which-fix-counts-evens
type: mcq
title: Which change makes it count the evens?
lesson: loops-with-decisions-and-debugging
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This program should print how many even numbers there are from 1 to 10 (the answer is 5), but it prints `1`:

```cpp
int count = 0;
for (int i = 1; i <= 10; i++)
{
    if (i % 2 == 0)
    {
        count = 1;
    }
}
cout << count << endl;
```

Which **single** changes make it print `5`? Pick **all** that work.

## Options

- [x] Change `count = 1;` to `count = count + 1;`
  Right: now each even `i` adds 1 to the count: 2, 4, 6, 8 and 10 give 5.
- [x] Change `count = 1;` to `count++;`
  Right: `count++` is a short way to write `count = count + 1`.
- [ ] Change `int count = 0;` to `int count = 1;`
  The `if` still sets `count` to 1 every time, so it still prints 1.
- [ ] Change `i % 2 == 0` to `i % 2 == 1`
  Now the odd numbers set `count` to 1, which still prints 1. The bug isn't the condition.
- [ ] Move `cout << count << endl;` inside the loop
  This prints 10 lines (0 or 1 each time) instead of one line with 5.

## Hints

- Trace `count` for i = 2 and i = 4. Does it ever get bigger than 1?
- A counter must add to the value that is already in its box.

## Explanation

The condition `i % 2 == 0` is right: it is TRUE for 2, 4, 6, 8 and 10. The bug is in what happens then. `count = 1;` **puts** 1 in the box each time, so after the second even number it is still 1.

A counter has to add to itself: `count = count + 1;` or `count++;`. Then `count` goes 1, 2, 3, 4, 5.

Starting `count` at 1 or changing the condition doesn't touch the real problem, and moving the `cout` into the loop changes what is printed, not the count.
