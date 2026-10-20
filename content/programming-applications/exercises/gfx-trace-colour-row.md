---
slug: gfx-trace-colour-row
type: trace
title: Where each circle starts and ends
lesson: colors-moving-and-text
difficulty: medium
updated: 2026-10-16
---

## Question

The program draws three circles in a row and prints where each one starts and ends across the window. What exactly does it print?

## Code

```python
from graphics import *

win = GraphWin("Row", 300, 100)
x = 50
for color in ["red", "green", "blue"]:
    dot = Circle(Point(x, 50), 30)
    dot.setFill(color)
    dot.draw(win)
    print(color, x - 30, x + 30)
    x = x + 80
win.close()
```

## Answer

```output
red 20 80
green 100 160
blue 180 240
```

## Hints

- A circle with radius 30 reaches 30 pixels to the left and 30 to the right of its center.
- `x` grows by 80 after each circle.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | first center x | x = 50 | |
| 5 | first colour from the List | color = "red"; x = 50 | |
| 6 | a new Circle centered at (50, 50), then filled and drawn | color = "red"; x = 50 | |
| 9 | print 50 − 30 and 50 + 30 | color = "red"; x = 50 | red 20 80\n |
| 10 | the next center, 80 further right | x = 130 | |
| 5 | next colour | color = "green"; x = 130 | |
| 9 | print 130 − 30 and 130 + 30 | color = "green"; x = 130 | green 100 160\n |
| 10 | the next center | x = 210 | |
| 5 | last colour | color = "blue"; x = 210 | |
| 9 | print 210 − 30 and 210 + 30 | color = "blue"; x = 210 | blue 180 240\n |
| 10 | x grows again, but the List has no more colours | x = 290 | |
| 11 | close the window | | |

## Explanation

The loop makes a **new** Circle object for each colour, centered at the current `x`. Each one covers from `x − 30` to `x + 30`. After each circle, `x` grows by 80, so the centers are 50, 130 and 210. The gap between one circle's right edge and the next one's left edge is 20 pixels (80 to 100, 160 to 180).
