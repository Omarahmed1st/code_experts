---
slug: cvr-waitkey-zero
type: mcq
title: What waitKey(0) does
lesson: reading-and-showing-images
difficulty: easy
updated: 2026-10-16
---

## Question

What does `cv2.waitKey(0)` do in this program?

## Code

```python
import cv2

img = cv2.imread("street.png")
cv2.imshow("Original Image", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

## Options

- [x] It waits, for as long as it takes, until a key is pressed.
  Right: 0 means "wait forever". While it waits, OpenCV draws the window.
- [ ] It waits 0 seconds, so the program goes straight on.
  0 is the special value for "no time limit", not "no waiting".
- [ ] It waits until the user presses the 0 key.
  Any key ends the wait.
- [ ] It closes the window when a key is pressed.
  Closing is the job of `cv2.destroyAllWindows()` on the next line.

## Explanation

`cv2.waitKey(0)` pauses the program until **any** key is pressed while the window is selected. Without it, the window would flash open and shut, or stay grey and frozen, because OpenCV only draws its windows while it waits for a key.
