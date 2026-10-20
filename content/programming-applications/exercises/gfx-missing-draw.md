---
slug: gfx-missing-draw
type: mcq
title: An empty window
lesson: graphics-practice-and-debugging
difficulty: easy
updated: 2026-10-16
---

## Question

The window opens, but it is empty. Why?

## Code

```python
from graphics import *

win = GraphWin("Sun", 400, 300)
sun = Circle(Point(200, 100), 40)
sun.setFill("yellow")
win.getMouse()
win.close()
```

## Options

- [x] `sun.draw(win)` is never called, so the circle is never shown.
  Right: creating a shape only makes the object. Nothing appears until it is drawn.
- [ ] `setFill` must be called after `draw`.
  Colour can be set before or after drawing. The problem is that it is never drawn.
- [ ] The circle is outside the window.
  (200, 100) is inside a 400 × 300 window, and a radius of 40 keeps the whole circle inside.
- [ ] `getMouse()` hides every shape until the user clicks.
  `getMouse()` only waits for a click. It doesn't hide anything.

## Explanation

This is the first item on the debugging checklist: **every shape must call `.draw(win)`**. Add `sun.draw(win)` before `win.getMouse()` and the yellow sun appears.
