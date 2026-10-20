---
slug: cvr-trace-none-check
type: trace
title: A typo in the file name
lesson: reading-and-showing-images
difficulty: medium
updated: 2026-10-16
---

## Question

The folder has `street.png`, but the program asks for `streets.png`. What does the program print? (Ignore any warning line that OpenCV itself may add.)

## Code

```python
import cv2

img = cv2.imread("streets.png")
if img is None:
    print("No image")
else:
    print(img.shape)
print("End")
```

## Answer

```output
No image
End
```

## Hints

- Does `imread` stop the program when the file isn't there?
- The last line is outside the `if`/`else`.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 3 | the file doesn't exist, so imread gives back None | img = None | |
| 4 | the check is True | img = None | |
| 5 | print the message | | No image\n |
| 8 | always runs | | End\n |

## Explanation

`cv2.imread()` does **not** stop with an error when it can't read a file: it returns `None`. Checking with `if img is None:` straight after reading lets the program say what went wrong. Without the check, `img.shape` would fail with a confusing `AttributeError: 'NoneType' object has no attribute 'shape'`.
