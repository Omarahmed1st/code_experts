---
slug: debug-missing-braces
type: mcq
title: A while loop without braces
lesson: loops-with-decisions-and-debugging
difficulty: medium
updated: 2026-10-10
---

## Question

The programmer wanted to print `123`. The indentation makes `i++;` look like it is inside the loop. What really happens when this program runs?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int i = 1;
    while (i <= 3)
        cout << i;
        i++;
    cout << endl;
    return 0;
}
```

## Options

- [ ] It prints `123` and stops.
  That would need braces `{ }` around both statements. Indentation doesn't decide what is inside a loop.
- [ ] It prints `1` once and stops.
  The loop doesn't stop after one pass: the condition is checked again, and `i` is still 1.
- [x] It prints `1` again and again and never stops.
  Right: without braces, only `cout << i;` is in the loop. `i++` never runs, so `i <= 3` stays true forever.
- [ ] It doesn't compile, because the braces are missing.
  Braces are optional for a single statement, so this compiles. The bug is in the logic, not the syntax.

## Hints

- Without braces, how many statements after `while ( … )` belong to the loop?
- Does the computer read the spaces at the start of a line?

## Explanation

Without braces, only the **first** statement after `while ( … )` is the loop body. Here that is `cout << i;`. The line `i++;` is outside the loop, even though it is indented like the body: C++ ignores indentation.

So the loop prints `1`, checks `1 <= 3` again (still true, because `i` never changes), prints `1` again, and so on: an infinite loop. This is the "missing braces" mistake from the list of six loop mistakes, and it causes the same problem as a missing update.

The fix is to put braces around the whole body:

```cpp
while (i <= 3)
{
    cout << i;
    i++;
}
```

Always using braces, even for one statement, avoids this bug.
