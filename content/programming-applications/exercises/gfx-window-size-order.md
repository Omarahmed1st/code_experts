---
slug: gfx-window-size-order
type: mcq
title: What the two numbers mean
lesson: graphics-windows-and-coordinates
difficulty: easy
updated: 2026-10-16
---

## Question

What does this line create?

## Code

```python
win = GraphWin("Shop", 600, 250)
```

## Options

- [x] A window titled Shop, 600 pixels wide and 250 pixels tall.
  Right: after the title comes the width, then the height.
- [ ] A window titled Shop, 250 pixels wide and 600 pixels tall.
  Width comes first. This mix-up is one of the common mistakes in the lecture.
- [ ] A window whose top-left corner is at (600, 250) on the screen.
  The numbers are the window's size, not its position.
- [ ] A square window, 600 × 600, with a bar 250 pixels high.
  A GraphWin takes one width and one height. There is no bar.

## Explanation

`GraphWin(title, width, height)` creates a window object. The title is a String, then the **width** in pixels, then the **height**. So this window is wide and short: 600 across, 250 down. Inside it, x goes from 0 to 600 and y from 0 to 250.
