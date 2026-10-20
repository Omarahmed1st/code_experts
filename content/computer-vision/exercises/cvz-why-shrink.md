---
slug: cvz-why-shrink
type: mcq
multiple: true
title: Why shrink an image first?
lesson: resizing-images
difficulty: easy
updated: 2026-10-16
---

## Question

Why do computer vision programs often shrink camera images before processing them? Pick **all** the right reasons.

## Options

- [x] Every later step has fewer pixels to process, so it runs faster.
  Right: a vehicle that processes smaller frames can process more frames per second.
- [x] Many methods and models expect one fixed input size.
  Right: resizing gives every image the standard size.
- [x] A smaller array uses less memory.
  Right: this matters on a small board like the Jetson.
- [ ] A smaller image has more detail.
  Shrinking throws pixels away, so there is less detail, not more.
- [ ] Shrinking removes the colour channels.
  Resizing changes only the width and height. A colour image keeps its 3 channels.

## Explanation

Shrinking trades some detail for speed and memory. For many jobs, such as finding lane lines, a 640-pixel-wide frame still has all the detail the program needs.
