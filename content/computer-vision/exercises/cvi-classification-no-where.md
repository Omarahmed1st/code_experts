---
slug: cvi-classification-no-where
type: mcq
title: What a classifier doesn't say
lesson: computer-vision-tasks-and-applications
difficulty: medium
updated: 2026-10-16
---

## Question

An image classification model looks at a dashcam photo and answers `car`. What does this answer **not** tell you?

## Options

- [x] Where the car is in the picture
  Right: classification gives one label for the whole image. Finding where needs detection or segmentation.
- [ ] What the picture shows
  That is exactly what a classifier gives: one label for the whole picture.
- [ ] That the program looked at the picture's pixels
  Every model works on the pixel values; that's all it receives.
- [ ] Anything: a classifier always gives a box too
  Boxes come from object detection, not classification.

## Explanation

Classification asks "what is this a picture of?". It gives no location. Detection adds a box for each object, and segmentation finds each object's exact pixels.
