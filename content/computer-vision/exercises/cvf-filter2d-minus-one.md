---
slug: cvf-filter2d-minus-one
type: mcq
title: The -1 in filter2D
lesson: sharpening-images
difficulty: medium
updated: 2026-10-16
---

## Question

What does the `-1` mean in `cv2.filter2D(img, -1, kernel)`?

## Options

- [x] Make the result the same type as the input, so a `uint8` image stays `uint8`, with values kept between 0 and 255.
  Right: this is why −100 is stored as 0 and 350 as 255 when sharpening.
- [ ] Multiply every pixel by −1, which makes a negative image.
  The kernel holds the weights. The −1 argument is about the result's type.
- [ ] Use the last kernel in a list of kernels.
  `filter2D` takes one kernel.
- [ ] Apply the kernel once, backwards.
  The second argument chooses the output type; it doesn't change how the kernel is applied.

## Explanation

The second argument of `cv2.filter2D` is the **depth** (the number type) of the result. `-1` means "the same as the input". For a normal `uint8` image, results below 0 become 0 and results above 255 become 255, so the sharpened image can be shown and saved like the original.
