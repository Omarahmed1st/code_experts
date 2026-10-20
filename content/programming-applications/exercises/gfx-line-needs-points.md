---
slug: gfx-line-needs-points
type: mcq
title: Make a line correctly
lesson: drawing-shapes
difficulty: easy
updated: 2026-10-16
---

## Question

Which line creates a Line from (50, 50) to (250, 150)?

## Options

- [x] `line = Line(Point(50, 50), Point(250, 150))`
  Right: a Line is built from two Point objects, where it starts and where it ends.
- [ ] `line = Line(50, 50, 250, 150)`
  A Line takes two **Point objects**, not four numbers. This is an error.
- [ ] `line = Line(Point(50, 250), Point(50, 150))`
  Each Point needs its own x and y. These Points are (50, 250) and (50, 150), a different line.
- [ ] `line = Line(Point(50, 50))`
  A Line needs **exactly 2** Points: one for each end.

## Explanation

`Line(point1, point2)` builds one object from two others. Each Point holds one end: `Point(50, 50)` is where the line starts and `Point(250, 150)` is where it ends. Remember to call `line.draw(win)` afterwards to show it.
