---
slug: cvr-imshow-title
type: mcq
title: The first argument of imshow
lesson: reading-and-showing-images
difficulty: easy
updated: 2026-10-16
---

## Question

In `cv2.imshow("Original Image", img)`, what is `"Original Image"`?

## Options

- [x] The title of the window that shows the image
  Right: any text works. It also names the window, so two `imshow` calls with different titles open two windows.
- [ ] The name of the file the image is read from
  The file is read by `cv2.imread()`. `imshow` only displays what is already in `img`.
- [ ] The name of a new file the image is saved to
  `imshow` only displays. Saving is a different function.
- [ ] A label that is drawn on top of the picture
  The text appears in the window's title bar, not on the image.

## Explanation

`cv2.imshow(title, image)` displays `image` in a window called `title`. In the lab, showing the original and the processed image with two different titles puts them side by side for comparison.
