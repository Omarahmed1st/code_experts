---
slug: cvi-segmentation-pixels
type: mcq
title: Exactly which pixels?
lesson: computer-vision-tasks-and-applications
difficulty: easy
updated: 2026-10-16
---

## Question

A drone photographs a field. The program must mark **exactly which pixels** belong to diseased leaves, so the farmer can see the shape of each sick area. Which task is this?

## Options

- [x] Image segmentation
  Right: segmentation gives a label to every pixel, so it finds the exact region of each object.
- [ ] Object detection
  Detection draws a **box** around each object. A box also covers healthy leaves around the sick area.
- [ ] Image classification
  Classification would only say "this field has disease", with no location at all.
- [ ] Motion tracking
  Tracking follows an object from frame to frame in a video. Nothing here moves.

## Explanation

When the job needs the **exact shape** of something, not just a box around it, the task is segmentation. Every pixel is labelled, here as "diseased" or "not diseased".
