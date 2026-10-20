---
slug: enhancement-pipeline-and-challenge
title: An enhancement pipeline and the "fix this image" challenge
topic: image-enhancement
lecture: 2
difficulty: medium
description: Chain the steps of this lecture into one small enhancement pipeline, then fix a dark, flat and noisy image yourself. Ends with a summary of every OpenCV function from the lecture.
objectives:
  - Build a pipeline that reads, converts, resizes, denoises and enhances an image
  - Explain why the order of the steps matters
  - Diagnose an image's problems and choose OpenCV functions to fix them
  - Show an original and an enhanced image side by side with np.hstack
prerequisites:
  - Improving contrast automatically
  - Blurring and removing noise
related:
  - histogram-equalization
  - features-and-edges
updated: 2026-10-15
---

## [explanation] Putting the steps together

Each step of this lecture does one job. Real programs chain them into a **pipeline**, where the output of one step is the input of the next:

**Image → Grayscale → Resize → Denoise → Enhance contrast → Result**

This is step 2 of the computer vision pipeline from the first lecture, "image processing": preparing an image so the later steps (finding features, recognising objects) have the best possible input.

## [code] A small enhancement pipeline

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
resized = cv2.resize(gray, (640, 480))
blur = cv2.GaussianBlur(resized, (5, 5), 0)
enhanced = cv2.equalizeHist(blur)
print(img.shape, "->", enhanced.shape)
cv2.imshow("Original", img)
cv2.imshow("Enhanced", enhanced)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
(540, 960, 3) -> (480, 640)
```

```notes
4 | cvtColor | 1. grayscale | circle sky
5 | resize | 2. resize | square yel
6 | GaussianBlur | 3. denoise | diamond green
7 | equalizeHist | 4. enhance contrast | tri sky
8 | enhanced.shape | 1 channel, 640 × 480 | circle green
```

## [diagram] Each stage of the pipeline

![Six panels in a row: Image (the colour street scene), Grayscale, Resize (640 by 480, slightly squeezed), Denoise (a little softer), Enhance contrast (darker road and brighter sky) and the Result window](images/cv-pipeline-stages.png)

## [explanation] Why this order?

- **Grayscale first**: every later step then works on one channel instead of three, so it is faster. `equalizeHist` needs grayscale anyway.
- **Resize early**: the blur and the equalization then process 307,200 pixels instead of 518,400.
- **Denoise before enhancing**: equalization spreads values apart, and would make noise more visible if it were still there.

Notice that each line uses the **previous** line's variable: `gray` goes into `resize`, `resized` goes into `GaussianBlur`, and so on. A typo such as `cv2.GaussianBlur(gray, …)` silently skips the resize step.

## [explanation] Lab challenge: fix this image!

The image below is a poor-quality version of the street. Its problems:

- **low brightness**: it is too dark;
- **low contrast**: everything is a similar dull grey-green;
- **some noise**: grain on every pixel, and black and white dots.

You may use `cv2.cvtColor()`, `cv2.resize()`, `cv2.convertScaleAbs()`, `cv2.GaussianBlur()`, `cv2.medianBlur()` and `cv2.equalizeHist()`. Produce **Original VS Enhanced**, side by side. **There is no single correct solution: experiment!**

## [diagram] The poor-quality image

![A dark, dull version of the street scene at 640 by 360 pixels, covered in fine grain and scattered white and black dots](images/poor-street.png)

This is `poor-street.png`. Download it, and try the challenge yourself before reading on.

## [explanation] Diagnose first

Before changing anything, measure. Two quick checks help:

```python
print(img.mean())
print(img.min(), img.max())
```

The average is about 81, so the image is dark (the clean street averages 150). But `min()` and `max()` say **0 and 255**, which looks like full contrast. It isn't: the salt-and-pepper dots are 0 and 255 and hide the real range. Remove the dots first, then measure again.

## [code] One possible solution

```python program
import cv2
import numpy as np

img = cv2.imread("poor-street.png")
clean = cv2.medianBlur(img, 5)
print("range after median:", clean.min(), "to", clean.max())
enhanced = cv2.convertScaleAbs(clean, alpha=2.2, beta=-25)
print("average before:", round(img.mean(), 1))
print("average after:", round(enhanced.mean(), 1))
both = np.hstack([img, enhanced])
cv2.imshow("Original VS Enhanced", both)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
range after median: 22 to 132
average before: 80.6
average after: 150.4
```

```notes
5 | medianBlur | remove the dots first | circle sky
6 | clean.min() | the real range | square yel
7 | alpha=2.2, beta=-25 | spread and shift | diamond green
10 | np.hstack | side by side | circle green
```

## [diagram] Original VS Enhanced

![A window titled Original VS Enhanced. On the left, the dark, noisy, dull street. On the right, the same street with no dots, bright and colourful: blue sky, green grass and a red car, slightly softer than the clean original](images/cv-challenge.png)

## [explanation] How the numbers were chosen

1. **Noise first.** A median blur removes the black and white dots (and smooths the grain). Now the real range shows: **22 to 132**, only 110 levels wide and all in the dark half.
2. **Contrast: alpha.** To spread 110 levels over most of 0 to 255, multiply by about 240 ÷ 110 ≈ **2.2**.
3. **Brightness: beta.** 2.2 × 22 ≈ 48, so the darkest pixels would land at 48. A beta of **−25** moves them down to about 23. The brightest become 2.2 × 132 − 25 = 265, so a few of them stop at 255, which is acceptable.

The average went from 80.6 to 150.4, close to the clean street's 150. Your own solution may use different steps, for example grayscale and `equalizeHist` instead of alpha and beta, or a Gaussian blur after the median. Compare the results side by side and decide which looks best.

## [explanation] What did we learn?

| Step | Function |
|---|---|
| Read an image | `cv2.imread()` |
| Grayscale | `cv2.cvtColor()` |
| Resize | `cv2.resize()` |
| Brightness and contrast | `cv2.convertScaleAbs()` |
| Denoise | `cv2.GaussianBlur()`, `cv2.medianBlur()` |
| Sharpen | `cv2.filter2D()` |
| Contrast enhancement | `cv2.equalizeHist()` |

**Next lab: feature detection and matching.** We improved the image… now how can the computer find the important features inside it?

## [note] Check yourself

::: check In the pipeline, what goes wrong if you write `blur = cv2.GaussianBlur(gray, (5, 5), 0)`?
???
The blur works on `gray`, **not** on `resized`, so the resize step is skipped: `enhanced` comes out 960 × 540 instead of 640 × 480. No error appears; only the shape tells you.
:::

## [common_mistakes] Common mistakes

- **Using the wrong variable.** Each step must take the previous step's result.
- **Enhancing before denoising.** Brightening or equalizing a noisy image makes the noise stronger.
- **Trusting min() and max() on noisy images.** A few extreme dots hide the real range; denoise, then measure.
- **`np.hstack` with different sizes or channels.** Both images need the same height and the same number of channels, so don't stack a grayscale result next to a colour original without converting it.

## [key_takeaways] Key takeaways

- A pipeline chains steps: grayscale → resize → denoise → enhance.
- Order matters: denoise before you enhance, and resize early to save work.
- Diagnose an image (average, real range) before choosing a fix.
- `np.hstack([a, b])` shows an original and a result side by side.
