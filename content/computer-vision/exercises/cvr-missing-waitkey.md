---
slug: cvr-missing-waitkey
type: mcq
title: The window flashes and disappears
lesson: reading-and-showing-images
difficulty: easy
updated: 2026-10-16
---

## Question

A student runs this program. A window appears for a blink and disappears, or stays grey. What is the fix?

## Code

```python
import cv2

img = cv2.imread("street.png")
cv2.imshow("Street", img)
cv2.destroyAllWindows()
```

## Options

- [x] Add `cv2.waitKey(0)` after `cv2.imshow(...)`.
  Right: the program then waits for a key, and OpenCV draws the window while it waits.
- [ ] Call `cv2.imshow` twice.
  The window still isn't drawn, and the next line closes it at once.
- [ ] Change `"Street"` to `"street.png"`.
  The first argument is only the window's title. Any text works.
- [ ] Move `cv2.destroyAllWindows()` to before `cv2.imshow`.
  Then nothing waits for a key either, so the window still flashes or stays grey.

## Explanation

The correct order is: read, show, **wait**, close.

```python
cv2.imshow("Street", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```
