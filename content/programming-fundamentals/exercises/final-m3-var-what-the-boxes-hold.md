---
slug: final-m3-var-what-the-boxes-hold
type: mcq
title: What the boxes hold now
lesson: variables-named-boxes-in-memory
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A bookshop keeps the number of notebooks in stock in variables. Picture each variable as a labelled box in memory.

Which statements are **true** after line 8 has run? Pick **all** the true ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int boxes = 12;
    int shelf = boxes;
    boxes = boxes - 5;
    shelf = shelf + boxes;
    cout << boxes << " " << shelf << endl;
    return 0;
}
```

## Options

- [x] `shelf` holds 19.
  Right: on line 6 `shelf` got a **copy** of 12. On line 8 the right side is 12 + 7 = 19, which is stored back in `shelf`.
- [x] The box called `boxes` kept its name, but its value changed from 12 to 7.
  Right: a variable's name stays the same while the program runs; only the value inside the box changes.
- [ ] Line 6 joined `shelf` and `boxes` into one box, so line 7 changed `shelf` to 7 as well.
  Line 6 copies the **value** 12 into `shelf`. After that the two boxes are separate, and changing `boxes` doesn't touch `shelf`.
- [ ] `boxes` now holds two values, the old 12 and the new 7.
  A box holds one value at a time. Line 7 **replaced** 12 with 7, and the 12 is gone.

## Answer

```output
7 19
```

## Hints

- Does `shelf = boxes;` copy a value, or does it tie the two names together?
- When a new value is stored in a box, what happens to the old one?

## Explanation

Trace the boxes line by line:

| Line | boxes | shelf |
|---|---|---|
| 5 | 12 | |
| 6 | 12 | 12 (a copy) |
| 7 | 7 | 12 |
| 8 | 7 | 19 |

- `shelf = boxes;` copies the value that is in `boxes` **at that moment**. It does not link the two names. That is why line 7 changes only `boxes`.
- `boxes = boxes - 5;` works out 12 − 5 with the old value, then stores 7 in the same box. The 12 is replaced and gone.
- `shelf = shelf + boxes;` uses the values the boxes hold now: 12 + 7 = 19.

The name, the value and the type are the three things every variable has. The name and the type stay the same; only the value changes. The program prints `7 19`.
