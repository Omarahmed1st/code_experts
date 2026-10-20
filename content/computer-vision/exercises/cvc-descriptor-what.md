---
slug: cvc-descriptor-what
type: mcq
title: Keypoint or descriptor?
lesson: orb-keypoints-and-descriptors
difficulty: easy
updated: 2026-10-16
---

## Question

ORB gives each feature a keypoint and a descriptor. Which one lets the program recognise **what the feature looks like** in another image?

## Options

- [x] The descriptor: 32 numbers that describe the area around the keypoint
  Right: the descriptor is the fingerprint.
- [ ] The keypoint's position, `kp.pt`
  The position says **where** the feature is in this image. In another photo it will be somewhere else.
- [ ] The keypoint's size, `kp.size`
  The size only says how big an area ORB looked at.
- [ ] The number of keypoints, `len(keypoints)`
  That counts the features; it says nothing about any one of them.

## Explanation

| | Answers |
|---|---|
| **Keypoint** | **where** is the feature? (position, size, angle) |
| **Descriptor** | **what** does it look like? (32 numbers = 256 bits) |

The keypoint is the **address**, the descriptor is the **fingerprint**. Matching compares fingerprints.
