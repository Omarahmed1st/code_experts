---
slug: cvm-best-30
type: mcq
title: Which matches are drawn?
lesson: feature-matching
difficulty: easy
updated: 2026-10-16
---

## Question

Which matches does this code draw?

## Code

```python
matches = sorted(matches, key=lambda x: x.distance)
result = cv2.drawMatches(img1, kp1, img2, kp2, matches[:30], None)
```

## Options

- [x] The 30 matches with the **smallest** distances: the most similar pairs
  Right: sorting puts the smallest distances first, and `[:30]` takes the first 30.
- [ ] The 30 matches with the **largest** distances
  A smaller distance means **more** alike, and `sorted` puts the smallest first.
- [ ] 30 random matches
  After sorting, the order is by distance, not random.
- [ ] Every match whose distance is below 30
  `[:30]` is a slice: it takes the first 30 items, whatever their distances.

## Explanation

The distance counts differing bits, so **smaller is better**. `sorted(…, key=lambda x: x.distance)` orders the matches from most to least similar, and `matches[:30]` keeps the best 30. Drawing only the best few keeps the picture readable; hundreds of lines would hide everything.
