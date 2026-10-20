---
slug: cvf-denoise-first
type: mcq
title: Sharpen a noisy frame?
lesson: sharpening-images
difficulty: easy
updated: 2026-10-16
---

## Question

A camera frame is a little blurry **and** a little noisy. What should the program do?

## Options

- [x] Remove the noise first, then sharpen.
  Right: the sharpening kernel can't tell noise from edges, so the noise must go before it is made stronger.
- [ ] Sharpen first, then remove the noise.
  Sharpening first makes every noisy speck stronger, which makes it harder to remove.
- [ ] Only sharpen: sharpening removes noise too.
  Sharpening **strengthens** anything that differs from its neighbours, noise included.
- [ ] Sharpen several times, so the edges win over the noise.
  Every pass strengthens the noise as well, and the image soon looks harsh, with bright halos.

## Explanation

Sharpening makes each pixel **less** like its neighbours. A noisy speck is exactly that: a pixel that differs from its neighbours. So the rule is **denoise first, sharpen second**, for example a light `cv2.GaussianBlur` or `cv2.medianBlur` and then `cv2.filter2D` with the sharpening kernel.
