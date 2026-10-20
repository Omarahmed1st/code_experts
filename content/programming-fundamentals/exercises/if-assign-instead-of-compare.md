---
slug: if-assign-instead-of-compare
type: mcq
title: One = in the condition
lesson: decisions-if-then-else
difficulty: medium
updated: 2026-10-10
---

## Question

The programmer wanted to print `Hot` only when `temp` is 40. Look closely at the condition. What does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int temp = 20;
    if (temp = 40)
    {
        cout << "Hot" << endl;
    }
    else
    {
        cout << "Cold" << endl;
    }
    cout << "temp is " << temp << endl;
    return 0;
}
```

## Options

- [ ] `Cold`, then `temp is 20`
  This is what `temp == 40` would print. But the condition has only one `=`.
- [x] `Hot`, then `temp is 40`
  Right: `temp = 40` stores 40 in `temp`. A value that isn't 0 counts as TRUE, so the TRUE path runs.
- [ ] `Hot`, then `temp is 20`
  `Hot` is right, but `temp = 40` also changed the value in the box. It is 40 now.
- [ ] `Cold`, then `temp is 40`
  `temp` is now 40, which is not 0, so the condition counts as TRUE and the ELSE path is skipped.

## Answer

```output
Hot
temp is 40
```

## Hints

- What is the difference between `=` and `==`? One stores, one compares.
- After line 6, what value is in `temp`? Is that value 0?

## Explanation

A single `=` **stores** a value; `==` **compares** two values. So `if (temp = 40)` does not ask "is temp 40?". It puts 40 into `temp`, and then the condition uses that value. A value that isn't 0 counts as TRUE, so `Hot` is printed.

The second line shows the side effect: `temp` was changed from 20 to 40. The fix is `if (temp == 40)`, which would print `Cold` and `temp is 20`. Compile with warnings turned on: g++ notices this mistake and suggests brackets, which means "did you mean `==`?".
