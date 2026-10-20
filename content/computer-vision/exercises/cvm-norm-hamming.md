---
slug: cvm-norm-hamming
type: mcq
title: The right distance for ORB
lesson: feature-matching
difficulty: easy
updated: 2026-10-16
---

## Question

Which matcher is right for comparing **ORB** descriptors?

## Options

- [x] `cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)`
  Right: ORB descriptors are bits, and the Hamming distance counts how many bits differ.
- [ ] `cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)`
  `NORM_L2` treats the 32 numbers as measurements, which is meaningless for packed bits.
- [ ] `cv2.BFMatcher(cv2.COLOR_BGR2GRAY)`
  That is a `cvtColor` code, not a distance.
- [ ] `cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=256)`
  `crossCheck` is `True` or `False`. 256 is the number of bits in a descriptor.

## Explanation

Each ORB descriptor is 256 bits packed into 32 numbers. `cv2.NORM_HAMMING` compares two descriptors by counting the bits that differ: 0 means identical, and small numbers mean "looks alike".
