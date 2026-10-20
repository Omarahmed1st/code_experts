---
slug: gfx-move-up
type: mcq
title: Move it up
lesson: colors-moving-and-text
difficulty: easy
updated: 2026-10-16
---

## Question

Which call moves `circle` **40 pixels up**?

## Options

- [x] `circle.move(0, -40)`
  Right: up means a smaller y, so dy is negative.
- [ ] `circle.move(0, 40)`
  A positive dy moves **down**, because y grows downward in the window.
- [ ] `circle.move(-40, 0)`
  The first number is dx, so this moves 40 pixels **left**.
- [ ] `circle.move(40, 0)`
  This moves 40 pixels **right**.

## Explanation

`move(dx, dy)` takes the sideways amount first, then the up-or-down amount. Because y grows **downward** in a graphics window, moving up means making y smaller: a negative dy.
