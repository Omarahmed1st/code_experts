---
slug: cvi-feature-extraction-step
type: mcq
title: Which step is this?
lesson: computer-vision-tasks-and-applications
difficulty: medium
updated: 2026-10-16
---

## Question

A program takes a frame that has already been resized and smoothed, and finds the **edges** along the lane lines. Which pipeline step is it doing?

## Options

- [x] Feature extraction
  Right: finding simple, useful patterns such as edges and corners is step 3.
- [ ] Image processing
  Processing (step 2) only prepares the image: resizing and smoothing, which were already done here.
- [ ] Analysis
  Analysis (step 4) **interprets** the edges, for example deciding "these edges are the lane".
- [ ] Decision
  The decision (step 5) acts on the result, for example "keep in lane".

## Explanation

Edges and corners are **features**: simple patterns that later steps build on. The step before (processing) makes them easier to find; the step after (analysis) works out what they mean.
