---
slug: gfx-rectangle-size
type: mcq
title: How big is the rectangle?
lesson: drawing-shapes
difficulty: easy
updated: 2026-10-16
---

## Question

How wide and how tall is this rectangle?

## Code

```python
box = Rectangle(Point(40, 60), Point(240, 160))
```

## Options

- [x] 200 pixels wide and 100 pixels tall
  Right: width = 240 − 40 = 200 and height = 160 − 60 = 100.
- [ ] 240 pixels wide and 160 pixels tall
  Those are only the second corner's coordinates. The size is the **difference** between the two corners.
- [ ] 100 pixels wide and 200 pixels tall
  Width comes from the x values (40 and 240), height from the y values (60 and 160).
- [ ] 180 pixels wide and 200 pixels tall
  This mixes x and y values from different corners. Subtract x from x and y from y.

## Explanation

A Rectangle is defined by two opposite corners. Subtract the x values for the width and the y values for the height:

- width = 240 − 40 = **200**
- height = 160 − 60 = **100**
