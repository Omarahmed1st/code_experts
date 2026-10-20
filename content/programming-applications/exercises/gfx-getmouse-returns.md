---
slug: gfx-getmouse-returns
type: mcq
title: What does getMouse() give back?
lesson: mouse-clicks
difficulty: easy
updated: 2026-10-16
---

## Question

What does `click` refer to after this line runs and the user clicks inside the window?

## Code

```python
click = win.getMouse()
```

## Options

- [x] A Point object at the place the user clicked
  Right: so you can call `click.getX()` and `click.getY()`, or use `click` as the center of a Circle.
- [ ] A String such as `"320, 180"`
  It is not text. It is a Point object with its own methods.
- [ ] Nothing: `getMouse()` only pauses the program
  It does pause the program, but it also gives back where the click was.
- [ ] The window object `win`
  `win` is the window. `getMouse()` gives back a new Point.

## Explanation

`win.getMouse()` waits for a click, then **returns a Point object** at the click position. That is why `Circle(click, 30)` works: a Circle needs a center Point, and `click` is one.
