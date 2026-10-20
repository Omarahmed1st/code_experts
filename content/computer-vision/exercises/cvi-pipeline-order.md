---
slug: cvi-pipeline-order
type: mcq
title: The five steps in order
lesson: computer-vision-tasks-and-applications
difficulty: easy
updated: 2026-10-16
---

## Question

Which list shows the steps of the basic computer vision pipeline **in the right order**?

## Options

- [x] acquisition → processing → feature extraction → analysis → decision
  Right: capture the image, prepare it, find simple patterns, interpret them, then act.
- [ ] acquisition → feature extraction → processing → analysis → decision
  Processing comes **before** feature extraction: the image is cleaned and resized first, so the edges and corners found later are reliable.
- [ ] processing → acquisition → analysis → feature extraction → decision
  There is nothing to process before an image has been captured.
- [ ] acquisition → processing → analysis → decision → feature extraction
  The decision is always last: it acts on what the earlier steps found.

## Explanation

| Step | Example: a car's camera |
|---|---|
| 1. Image acquisition | one frame of the road ahead |
| 2. Image processing | make it the right size, reduce noise |
| 3. Feature extraction | edges, corners, lane-line pixels |
| 4. Analysis | "these edges are the lane" |
| 5. Decision | keep in lane, slow down |
