---
slug: sharpening-images
title: Sharpening images with a kernel
topic: filtering
lecture: 2
difficulty: medium
description: Make edges and details clearer with a sharpening kernel and cv2.filter2D. Work out by hand what the kernel does to a row of pixels, then sharpen the street image.
objectives:
  - Explain what a kernel is and how it computes each new pixel
  - Sharpen an image with cv2.filter2D and a 3 × 3 kernel
  - Calculate the effect of the sharpening kernel on a small row of values
  - Explain why sharpening also makes noise stronger
prerequisites:
  - Blurring and removing noise
related:
  - smoothing-and-noise
  - histogram-equalization
updated: 2026-10-15
---

## [explanation] Sharpening: the opposite of blurring

Blurring makes each pixel **more** like its neighbours. **Sharpening** makes each pixel **less** like its neighbours, so edges and details become clearer.

Both are done the same way: with a **kernel**, a small grid of numbers. **The kernel tells OpenCV how neighbouring pixels affect the new pixel.** This is the sharpening kernel from the lab:

| | left | centre | right |
|---|---|---|---|
| **above** | 0 | -1 | 0 |
| **middle** | -1 | **5** | -1 |
| **below** | 0 | -1 | 0 |

For every pixel, OpenCV multiplies the pixel and its neighbours by these numbers and adds the results:

**new = 5 × centre − above − below − left − right**

## [code] Step 9: sharpen the image

```python program
import cv2
import numpy as np

img = cv2.imread("street.png")
kernel = np.array([
    [ 0, -1,  0],
    [-1,  5, -1],
    [ 0, -1,  0]
])
sharp = cv2.filter2D(
    img, -1, kernel
)
cv2.imshow("Original", img)
cv2.imshow("Sharpened", sharp)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```notes
2 | numpy as np | to build the kernel | circle sky
6 | -1 | each neighbour counts × -1 | tri coral
7 | 5 | the centre pixel counts × 5 | square yel
10 | filter2D | apply any kernel | diamond green
11 | -1 | same type as img | circle green
```

## [diagram] Original and sharper

![Close-ups of a building's windows and the car, before and after sharpening. In the sharpened version the window edges and the car's outline are crisper, and the small stones on the road and the grass blades stand out more](images/cv-sharpen.png)

`cv2.filter2D(img, -1, kernel)` applies any kernel you give it. The `-1` means "make the result the same type as the input", so a `uint8` image stays `uint8` and the results are kept between 0 and 255.

## [code] What the kernel does to an edge

A tiny image makes the calculation easy to follow: three identical rows, dark (50) on the left and bright (200) on the right.

```python program
import cv2
import numpy as np

row = np.array([[50, 50, 50, 50, 200, 200, 200, 200]] * 3, dtype=np.uint8)
kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
sharp = cv2.filter2D(row, -1, kernel)
print(row[1])
print(sharp[1])
```

```output
[ 50  50  50  50 200 200 200 200]
[ 50  50  50   0 255 200 200 200]
```

```notes
4 | * 3 | three equal rows | circle sky
7 | row[1] | the middle row | square yel
8 | sharp[1] | after sharpening | diamond green
```

## [explanation] Following the numbers

Take the middle row. The rows above and below are the same, so "above" and "below" equal the centre.

| Pixel | Calculation | Result | Stored |
|---|---|---|---|
| a 50 far from the edge | 5 × 50 − 50 − 50 − 50 − 50 | 50 | 50 |
| the last 50 (right neighbour 200) | 5 × 50 − 50 − 50 − 50 − 200 | −100 | **0** |
| the first 200 (left neighbour 50) | 5 × 200 − 200 − 200 − 50 − 200 | 350 | **255** |
| a 200 far from the edge | 5 × 200 − 200 − 200 − 200 − 200 | 200 | 200 |

Two things to notice:

- In **flat areas nothing changes**, because the kernel's numbers add up to 1 (5 − 4 = 1).
- **At the edge**, the dark side gets darker and the bright side gets brighter. That extra jump is what our eyes see as "sharper". (−100 and 350 are kept between 0 and 255.)

## [explanation] Sharpening makes noise stronger too

The kernel can't tell a real edge from a noisy speck: both are pixels that differ from their neighbours, and both get stronger. Look at the road's stones and the grass in the close-up: they stand out more after sharpening.

So **remove noise first, sharpen second**, and never sharpen a noisy image on its own.

## [note] Check yourself

::: check A flat grey area has every pixel equal to 90. What does the sharpening kernel turn it into?
???
**90**: 5 × 90 − 4 × 90 = 90. The kernel's numbers add up to 1, so flat areas don't change.
:::

::: check Why is the blur kernel in the last lesson never negative, but this one has −1s?
???
A blur takes a (weighted) **average** of the neighbours, so all its weights are positive. Sharpening **subtracts** the neighbours from the centre to make the differences bigger, so it needs negative weights.
:::

## [common_mistakes] Common mistakes

- **Forgetting `import numpy as np`.** The kernel is a NumPy array; without the import, `np.array` is a `NameError`.
- **Weights that don't add up to 1.** With a centre of 6 instead of 5, flat areas get brighter too. Check the sum.
- **Sharpening a noisy image.** The noise gets louder. Denoise first.
- **Sharpening many times.** Each pass pushes edges further towards 0 and 255; the image soon looks harsh, with bright halos.

## [key_takeaways] Key takeaways

- A **kernel** says how each neighbour affects the new pixel; `cv2.filter2D(img, -1, kernel)` applies it.
- The sharpening kernel computes 5 × centre − the 4 neighbours.
- Flat areas stay the same; at edges, dark gets darker and bright gets brighter.
- Sharpening strengthens noise as well, so denoise before you sharpen.
