---
slug: gfx-trace-point-moves
type: trace
title: A Point that moves three times
lesson: colors-moving-and-text
difficulty: medium
updated: 2026-10-16
---

## Question

What exactly does this program print? (It opens no window: it only creates a Point and moves it.)

## Code

```python
from graphics import *

p = Point(100, 100)
p.move(30, 0)
p.move(0, -20)
p.move(-10, 50)
print(p.getX())
print(int(p.getY()))
```

## Answer

```output
120.0
130
```

## Hints

- Add up the x parts of the three moves, then the y parts, separately.
- How does graphics.py store a Point's coordinates: as whole numbers or as decimals?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 3 | create a Point at (100, 100) | p = Point(100.0, 100.0) | |
| 4 | 30 right | p = Point(130.0, 100.0) | |
| 5 | 20 up (negative dy) | p = Point(130.0, 80.0) | |
| 6 | 10 left and 50 down | p = Point(120.0, 130.0) | |
| 7 | print x, a decimal | | 120.0\n |
| 8 | `int()` drops the `.0` | | 130\n |

## Explanation

`move(dx, dy)` changes the same Point each time:

- x: 100 + 30 + 0 − 10 = **120**
- y: 100 + 0 − 20 + 50 = **130**

A negative dy moves **up** and a positive dy moves **down**. graphics.py stores coordinates as decimals, so `getX()` gives `120.0`. Line 8 passes `getY()` through `int()`, which is why it prints `130` with no `.0`, as in the interactive target program.
