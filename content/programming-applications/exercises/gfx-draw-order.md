---
slug: gfx-draw-order
type: mcq
title: Where did the red light go?
lesson: graphics-practice-and-debugging
difficulty: medium
updated: 2026-10-16
---

## Question

This program should show a red light on a black traffic-light body. What does the window show?

## Code

```python
from graphics import *

win = GraphWin("Light", 300, 500)
light = Circle(Point(150, 140), 50)
light.setFill("red")
light.draw(win)
body = Rectangle(Point(75, 50), Point(225, 450))
body.setFill("black")
body.draw(win)
win.getMouse()
win.close()
```

## Options

- [x] Only a black rectangle: the body is drawn last, so it covers the red circle.
  Right: shapes drawn later appear on top of shapes drawn earlier.
- [ ] A red circle on top of a black rectangle.
  That needs the body drawn **first**, then the light.
- [ ] Nothing, because a Circle and a Rectangle can't be in the same window.
  Any number of shapes can share a window.
- [ ] The program stops with an error, because the circle is inside the rectangle.
  Shapes may overlap. Python draws them in the order of the `draw()` calls.

## Explanation

Each `draw()` paints the shape **on top of** everything already in the window. Here the red circle is painted first and the black rectangle, which surrounds it completely, is painted over it. The fix is to draw back to front: create and draw the body first, then the light.
