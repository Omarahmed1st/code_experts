---
slug: cvi-detection-boxes
type: mcq
title: A box around every customer
lesson: computer-vision-tasks-and-applications
difficulty: easy
updated: 2026-10-16
---

## Question

A shop camera must draw a box around **every customer** in the picture and write "person" next to each box. Which computer vision task is this?

## Options

- [x] Object detection
  Right: detection says **what** each object is and **where** it is, with a box.
- [ ] Image classification
  Classification gives **one label** for the whole image, and no location.
- [ ] Image segmentation
  Segmentation labels **every pixel**, which gives each person's exact outline, not a box.
- [ ] Face recognition
  Face recognition says **who** a face belongs to. Here we only need to find people.

## Explanation

The three tasks answer more and more detailed questions about the same image:

| Task | Answer |
|---|---|
| Classification | one label for the whole image |
| Detection | a label **and a box** for each object |
| Segmentation | a label for every pixel |

A box and a label for each customer is detection.
