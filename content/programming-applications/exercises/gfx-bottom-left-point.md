---
slug: gfx-bottom-left-point
type: mcq
title: Nearest the bottom-left corner
lesson: graphics-windows-and-coordinates
difficulty: easy
updated: 2026-10-16
---

## Question

A window is made with `GraphWin("Map", 400, 300)`. Which point is **nearest the bottom-left corner**?

## Options

- [x] `Point(20, 280)`
  Right: a small x is near the left edge, and a large y is near the bottom, because y grows downward.
- [ ] `Point(20, 20)`
  A small y is near the **top**. This point is near the top-left corner.
- [ ] `Point(380, 280)`
  A large x is near the **right** edge. This point is near the bottom-right corner.
- [ ] `Point(280, 20)`
  This one is towards the top-right: x is large and y is small.

## Explanation

(0, 0) is the **top-left** corner. x counts pixels from the left edge, and y counts pixels **down** from the top edge. In a 400 × 300 window the bottom-left corner is (0, 300), and (20, 280) is only 20 pixels from each of those two edges.
