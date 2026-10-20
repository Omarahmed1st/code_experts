---
slug: cvr-cv2-name-clash
type: mcq
title: A program file called cv2.py
lesson: reading-and-showing-images
difficulty: medium
updated: 2026-10-16
---

## Question

OpenCV is installed. A student saves this program as **cv2.py** and runs it. It stops on line 3 with an `AttributeError` saying that `cv2` has no attribute `imread`. Why?

## Code

```python
import cv2

img = cv2.imread("street.png")
print(img.shape)
```

## Options

- [x] `import cv2` imported the student's own file, cv2.py, instead of OpenCV.
  Right: Python looks in the program's own folder first, and the student's file has no `imread`.
- [ ] OpenCV must be installed again with `pip install opencv-python`.
  OpenCV is installed. The problem is which file `import cv2` finds first.
- [ ] `imread` needs the full path of the image.
  A missing file doesn't give this error: `imread` would return `None`.
- [ ] `street.png` is in a different folder.
  Then `imread` returns `None`, and the error would come one line later, on `img.shape`.

## Explanation

When you write `import cv2`, Python first looks for a file named `cv2.py` in your program's folder. If it finds one, it imports that instead of OpenCV. Rename your program, for example to `show_image.py`, and run it again.
