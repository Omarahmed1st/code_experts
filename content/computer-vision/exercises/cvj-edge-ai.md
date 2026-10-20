---
slug: cvj-edge-ai
type: mcq
title: What edge AI means
lesson: jetson-vision-vehicle
difficulty: easy
updated: 2026-10-16
---

## Question

The project vehicle uses **edge AI**. What does that mean?

## Options

- [x] The frames are processed on the vehicle itself, by the Jetson, close to where they are captured.
  Right: the decision is made on board, without waiting for a network.
- [ ] The AI only looks at the edges of each image.
  A common mix-up with edge detection. "Edge" here means the edge of the network: the device itself.
- [ ] The camera sends every frame over the network to a powerful computer, which sends the answer back.
  That is the opposite: slow, and useless if the connection drops.
- [ ] The vehicle drives along the edge of the road.
  Edge AI is about where the processing happens, not where the vehicle drives.

## Explanation

**Edge AI: AI processing happens close to where the data is generated.** On the vehicle, the Jetson (a small computer with a GPU) runs the computer vision on every frame, so the vehicle can react quickly and still works with no network.
