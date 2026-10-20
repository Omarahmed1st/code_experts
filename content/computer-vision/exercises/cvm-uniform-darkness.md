---
slug: cvm-uniform-darkness
type: mcq
title: Why darkness barely matters
lesson: feature-matching
difficulty: hard
updated: 2026-10-16
---

## Question

In the lecture's experiment, making image B **uniformly darker** (half the brightness) kept 252 of 258 good matches, but **uneven lighting** kept only 91. Why?

## Options

- [x] ORB compares pixels with each other. Darkening everything equally keeps those comparisons the same; uneven lighting changes them.
  Right: if one pixel was darker than another, it still is after uniform darkening.
- [ ] ORB converts every image to the same brightness before it starts.
  ORB doesn't adjust the brightness. The comparisons themselves are what make it robust.
- [ ] Darker images have more corners, so there are more matches.
  The number barely changed (252 of 258). Darkness didn't add features.
- [ ] Uneven lighting makes the image smaller.
  Lighting doesn't change the image's size.

## Explanation

Each bit of an ORB descriptor answers "is this pixel darker than that one?" Halving every pixel keeps every answer the same, so the descriptor hardly changes. When one side is darkened and the other brightened, some answers flip, the descriptors change, and fewer pairs match.
