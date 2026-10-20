---
slug: img-imread-wrong-file-name
type: mcq
title: A typo in the file name
lesson: digital-images-and-pixels
difficulty: easy
updated: 2026-10-10
---

## Question

The file next to the program is called `shapes.png`, but the student typed the name wrong:

```python
import cv2

img = cv2.imread("shape.png")
print(img.shape)
```

What happens when this program runs?

## Options

- [x] `cv2.imread` returns `None`, and the program stops on the next line with an error like `'NoneType' object has no attribute 'shape'`.
  Right: OpenCV doesn't stop when the file is missing. It gives back `None` and only prints a warning, so the error appears later, on the line that uses `img`.
- [ ] The program stops on the `cv2.imread` line with a "file not found" error.
  That would be easier to debug, but OpenCV doesn't raise an error for a missing file. It returns `None`.
- [ ] `cv2.imread` returns an empty black image, so it prints `(0, 0, 3)`.
  OpenCV doesn't make up an image. When it can't read the file, it returns `None`, which has no `shape`.
- [ ] OpenCV creates a new file called `shape.png`.
  `cv2.imread` only reads files. Writing a file is the job of `cv2.imwrite`.

## Hints

- Does `cv2.imread` stop the program when it can't find the file, or does it give something back?
- The error message talks about `'NoneType'`. Where could a `None` come from?

## Explanation

When `cv2.imread` can't read a file (a wrong name, a wrong folder, or a file that isn't an image), it **returns `None`** instead of stopping the program. OpenCV may print a warning, but the program goes on. The real error appears later, when the code tries to use the image: `None` has no `shape`, so you see `'NoneType' object has no attribute 'shape'`.

That message doesn't mention the file name, which makes the bug confusing. Check right after reading:

```python
img = cv2.imread("shapes.png")
if img is None:
    print("Could not read the image")
```
