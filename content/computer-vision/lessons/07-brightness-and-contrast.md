---
slug: brightness-and-contrast
title: Brightness and contrast
topic: brightness-and-contrast
lecture: 2
difficulty: medium
description: Make an image brighter with beta and punchier with alpha, using one formula, new = alpha × old + beta. Experiment with both, then avoid the overflow bug that turns bright pixels dark.
objectives:
  - Explain brightness and contrast as changes to pixel values
  - Apply new = alpha × old + beta with cv2.convertScaleAbs
  - Predict what larger or smaller alpha and beta values do to an image
  - Explain why adding to a uint8 image with + wraps around
  - Choose alpha and beta for a dull, low-contrast photo
prerequisites:
  - Digital images and pixels
related:
  - resizing-images
  - smoothing-and-noise
  - digital-images-and-pixels
updated: 2026-10-15
---

## [explanation] Brightness and contrast are arithmetic

Every pixel value is a number from 0 (dark) to 255 (bright), so changing how an image looks means changing those numbers:

- **Brightness**: add the same amount to every value. Adding makes the whole image lighter; subtracting makes it darker.
- **Contrast**: multiply every value. Multiplying by more than 1 pushes values apart, so dark parts get darker relative to bright parts and details stand out. Multiplying by less than 1 squeezes them together and the image looks flat.

Both fit in one formula, applied to every channel of every pixel:

**new = alpha × old + beta**

Here `alpha` controls contrast and `beta` controls brightness. `alpha = 1` and `beta = 0` leave the image unchanged.

## [code] Step 5: make the image brighter

```python program
import cv2

img = cv2.imread("street.png")
bright = cv2.convertScaleAbs(
    img,
    alpha=1,
    beta=50
)
print("average before:", round(img.mean(), 1))
print("average after:", round(bright.mean(), 1))
cv2.imshow("Original", img)
cv2.imshow("Bright", bright)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
average before: 150.0
average after: 194.4
```

```notes
4 | convertScaleAbs | alpha × old + beta | circle sky
6 | alpha=1 | contrast unchanged | square yel
7 | beta=50 | + 50: brighter | diamond green
9 | img.mean() | the average value | circle green
```

## [diagram] beta = -50, 0 and +50

![Three versions of the street scene side by side. beta = -50 is darker all over, beta = 0 is the original, beta = +50 is lighter and slightly washed out, with the sky almost white](images/cv-beta.png)

**beta controls brightness**: `beta > 0` makes the image brighter, `beta < 0` makes it darker.

Why did the average only go up by 44.4, not 50? Because many values were already above 205, and 205 + 50 would pass 255. `convertScaleAbs` stops them at 255 (look at the washed-out sky on the right). Values that hit 255 lose their differences for good.

## [code] Step 6: change the contrast

```python program
import cv2

img = cv2.imread("street.png")
contrast = cv2.convertScaleAbs(
    img,
    alpha=1.5,
    beta=0
)
saturated = (contrast == 255).mean() * 100
print("values at 255:", round(saturated, 1), "%")
cv2.imshow("Contrast", contrast)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
values at 255: 37.8 %
```

```notes
6 | alpha=1.5 | × 1.5: more contrast | circle sky
9 | contrast == 255 | which values hit the top | square yel
```

## [diagram] alpha = 0.5, 1 and 2

![Three versions of the street scene. alpha = 0.5 is dark and flat, with low contrast. alpha = 1 is the original. alpha = 2 has very strong colours and large white areas where the sky and the buildings became pure white](images/cv-alpha.png)

**alpha controls contrast**: `alpha < 1` makes the image **flatter**, `alpha > 1` makes it **punchier**. `street.png` is already bright (its average is 150), so `alpha = 1.5` pushes 37.8% of all values to 255, and `alpha = 2` even more. On a dark, dull photo the same alpha would look much better. The lesson's second image, below, is such a photo.

## [explanation] Experiment with alpha and beta

Change the two numbers, run, and observe:

```python
result = cv2.convertScaleAbs(
    img,
    alpha=1.5,
    beta=30
)
cv2.imshow("Result", result)
```

Try every alpha in **0.5, 1, 1.5, 2** with every beta in **-50, 0, 50, 100**. For each one, write down what happens to the image. Which combination gives the best-looking result? The grid below shows all sixteen on `street.png`, so you can compare with your own image.

## [diagram] Sixteen combinations

![A grid of sixteen small versions of the street scene. Rows are alpha 0.5, 1, 1.5 and 2 from top to bottom; columns are beta -50, 0, 50 and 100 from left to right. The top-left image is very dark, the bottom-right almost white, and the original is in the second row, second column](images/cv-alpha-beta.png)

Reading the grid: down a column, alpha spreads the values further apart; along a row, beta moves them all up. Corners with a large alpha and a large beta turn white; small ones turn very dark. For this bright image the best results are near the original; for a dark image they would be further down and to the right.

## [diagram] A dull image to fix

![A dull, grey-looking drawing of a landscape: a pale sky, a dim sun, a low hill, a small house and green ground](images/scene.png)

This is `scene.png`, 270 × 180 pixels: dull and grey, the kind of photo alpha and beta are made for. Download it with the link under the picture to run the examples below on your own computer.

## [code] The formula on three numbers

Before touching a whole image, try the formula on three pixel values. `cv2.convertScaleAbs()` computes `alpha × value + beta`, rounds the result and keeps it between 0 and 255.

```python program
import cv2
import numpy as np

row = np.array([[100, 150, 200]], dtype=np.uint8)
print(cv2.convertScaleAbs(row, alpha=1.5, beta=10))
```

```output
[[160 235 255]]
```

```notes
4 | dtype=np.uint8 | values 0 to 255 | circle sky
5 | alpha=1.5 | contrast: × 1.5 | square yel
5 | beta=10 | brightness: + 10 | diamond green
```

## [explanation] Following the numbers

| old | 1.5 × old + 10 | stored |
|---|---|---|
| 100 | 160 | 160 |
| 150 | 235 | 235 |
| 200 | 310 | **255** |

The last value would be 310, but a `uint8` pixel can't go above 255, so OpenCV stores 255. This is called **saturation**: the value stops at the limit instead of going past it.

## [diagram] A dull photo and two fixes

![Three versions of a simple landscape with a hill, a house and a sun. The original is grey and flat; the beta 60 version is lighter but still flat; the alpha 2.0, beta minus 110 version has stronger colours and clearer edges](images/brightness-contrast.png)

The original `scene.png` (left) is dull: its values only range from 88 to 150. Adding brightness (middle) lifts everything but keeps it flat. Raising the contrast (right) spreads the values out, and the hill, house and sun stand out.

## [code] Adjusting a real image

```python program
import cv2

img = cv2.imread("scene.png")
print("before:", img.min(), img.max())
brighter = cv2.convertScaleAbs(img, alpha=1.0, beta=60)
print("brighter:", brighter.min(), brighter.max())
punchy = cv2.convertScaleAbs(img, alpha=2.0, beta=-110)
print("contrast:", punchy.min(), punchy.max())
cv2.imwrite("punchy.png", punchy)
```

```output
before: 88 150
brighter: 148 210
contrast: 66 190
```

```notes
4 | img.min(), img.max() | darkest and brightest | circle sky
5 | beta=60 | everything + 60 | square yel
7 | alpha=2.0, beta=-110 | spread out, then shift | diamond green
```

## [explanation] Why the contrast fix needs a negative beta

With `alpha = 2.0` alone, the darkest value 88 would become 176 and the brightest 150 would become 300, which saturates to 255: most of the image would turn almost white. Subtracting 110 brings the range back down to **66 to 190**. The spread is now 124 values instead of 62, which is what "more contrast" means.

A useful way to choose: pick `alpha` for the spread you want, then pick `beta` so the result is centred in 0 to 255.

## [note] Check yourself

::: check What does this print?
```python
import cv2
import numpy as np

row = np.array([[40, 200]], dtype=np.uint8)
print(cv2.convertScaleAbs(row, alpha=0.5, beta=0))
```
???
```output
[[ 20 100]]
```
Multiplying by 0.5 halves every value, so the two values move closer together: **less contrast**. NumPy pads the 20 with a space so the columns line up.
:::

## [common_mistakes] The overflow bug: using + on uint8 images

It's tempting to brighten with `img + 100`. With `uint8` arrays, NumPy does **not** stop at 255: it **wraps around** and starts again from 0. So 250 + 10 becomes 4, a nearly black value, right where the image was brightest.

```python program
import cv2
import numpy as np

row = np.array([[100, 200, 250]], dtype=np.uint8)
print(row + 10)
print(cv2.convertScaleAbs(row, alpha=1.0, beta=10))
```

```output
[[110 210   4]]
[[110 210 255]]
```

```notes
5 | row + 10 | wraps: 260 becomes 4 | tri coral
6 | cv2.convertScaleAbs | stops at 255 | circle green
```

## [diagram] What the overflow does to a picture

![Three versions of the shapes image. The original has a yellow circle and a light-blue square. Adding 100 with NumPy turns the circle purple and the square red because bright values wrapped around. convertScaleAbs makes both shapes lighter, as expected](images/overflow.png)

With `img + 100` (middle) the yellow circle turns purple and the light-blue square turns red: their bright channels went past 255 and wrapped around to small numbers. `convertScaleAbs` (right) gives the lighter image you expected.

## [common_mistakes] Other common mistakes

- **Too much alpha.** Large values push most pixels to 255 (pure white) and the detail is lost for good. Check `min()` and `max()` after adjusting.
- **Changing the original by accident.** `convertScaleAbs` returns a **new** image. Keep the result in a new variable if you still need the original.
- **Expecting negative results.** `convertScaleAbs` takes the absolute value before saturating, so a result of -20 is stored as 20, not 0. Choose `beta` so results stay positive.

## [key_takeaways] Key takeaways

- Brightness adds (`beta`); contrast multiplies (`alpha`): **new = alpha × old + beta**.
- `cv2.convertScaleAbs(img, alpha=…, beta=…)` applies the formula and keeps results from 0 to 255.
- `uint8` arithmetic with `+` wraps around past 255; that's why bright areas turn dark.
- After adjusting, check `img.min()` and `img.max()` to see the new range.
