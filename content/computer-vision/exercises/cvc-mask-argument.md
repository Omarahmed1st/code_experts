---
slug: cvc-mask-argument
type: mcq
title: detectAndCompute stops with an error
lesson: orb-keypoints-and-descriptors
difficulty: medium
updated: 2026-10-16
---

## Question

This line stops with an error saying `detectAndCompute()` is **missing required argument 'mask'**. What is the fix?

## Code

```python
keypoints, descriptors = orb.detectAndCompute(gray)
```

## Options

- [x] `orb.detectAndCompute(gray, None)`: `None` means "no mask, search the whole image".
  Right: the mask argument is required, even when you don't want one.
- [ ] `orb.detectAndCompute(gray, 500)`, to give the number of keypoints
  The number of keypoints is set when the detector is made: `cv2.ORB_create(nfeatures=500)`.
- [ ] `orb.detect(gray)`, because ORB can't compute descriptors
  ORB can do both; that is what `detectAndCompute` is for.
- [ ] Convert `gray` back to colour first
  The image is fine. The call is missing an argument.

## Explanation

`detectAndCompute(image, mask)` needs two arguments. A **mask** would limit the search to part of the image; `None` means there is no mask, so ORB searches everywhere. It returns two things, in this order: the keypoints, then the descriptors.
