---
slug: resizing-images
title: Changing image size
topic: image-resizing
lecture: 2
difficulty: easy
description: Resize an image with cv2.resize, remember that the size is given as (width, height), and keep the aspect ratio so the picture isn't stretched.
objectives:
  - Resize an image to a fixed size with cv2.resize
  - Give the new size in the right order, (width, height)
  - Explain why computer vision programs resize images
  - Keep the aspect ratio by calculating the new height, or by using fx and fy
prerequisites:
  - Getting started with OpenCV
related:
  - grayscale-images
  - enhancement-pipeline-and-challenge
updated: 2026-10-15
---

## [explanation] Why resize?

Cameras give images of many sizes: 1280 × 720, 1920 × 1080, 4000 × 3000. Computer vision programs often shrink them first:

| Reason | Why it helps |
|---|---|
| **Faster processing** | fewer pixels means less work for every later step |
| **Standard input size** | many methods and models expect one fixed size |
| **Lower memory use** | a smaller array takes less memory, which matters on a small board like the Jetson |

A vehicle that has to react quickly is a good example: processing a smaller frame leaves time to process more frames per second.

## [code] Step 4: resize to 640 × 480

```python program
import cv2

img = cv2.imread("street.png")
resized = cv2.resize(img, (640, 480))
print("original:", img.shape)
print("resized:", resized.shape)
print("numbers before:", img.size)
print("numbers after:", resized.size)
cv2.imshow("Resized", resized)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
original: (540, 960, 3)
resized: (480, 640, 3)
numbers before: 1555200
numbers after: 921600
```

```notes
4 | (640, 480) | (width, height)! | circle sky
6 | resized.shape | (height, width, …) | square yel
7 | img.size | how many numbers | diamond green
```

## [explanation] Width first here, height first in shape

This is the most common mix-up in OpenCV:

| Where | Order | For our resized image |
|---|---|---|
| `cv2.resize(img, (640, 480))` | **(width, height)** | 640 wide, 480 tall |
| `resized.shape` | **(height, width, channels)** | `(480, 640, 3)` |

`img.size` counts every number in the array: 540 × 960 × 3 = 1,555,200 before and 480 × 640 × 3 = 921,600 after. The resized image needs about 40% less memory and work.

## [diagram] Three sizes of the same street

![Three windows drawn at the same scale. Original, 960 by 540. Resized to 640 by 480: smaller, and the scene is squeezed sideways so the car looks narrow and tall. Keeping the ratio, 640 by 360: smaller, with the scene's proportions unchanged](images/cv-resize.png)

## [explanation] Keep the aspect ratio

The **aspect ratio** is width divided by height. `street.png` is 960 × 540, a ratio of 16:9 (like a TV). 640 × 480 is 4:3, a different shape, so the picture is **squeezed**: look at the car in the middle window.

That is fine for a program that needs exactly 640 × 480, but for people (and for measuring shapes) it is better to keep the ratio. Pick the new width and calculate the height from it:

**new height = old height × new width ÷ old width = 540 × 640 ÷ 960 = 360**

## [code] Resizing without stretching

```python program
import cv2

img = cv2.imread("street.png")
h, w = img.shape[:2]
new_w = 640
new_h = int(h * new_w / w)
small = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
print(small.shape)
half = cv2.resize(img, None, fx=0.5, fy=0.5)
print(half.shape)
```

```output
(360, 640, 3)
(270, 480, 3)
```

```notes
4 | img.shape[:2] | height and width only | circle sky
6 | int( | sizes must be whole numbers | square yel
7 | INTER_AREA | best for shrinking | diamond green
9 | fx=0.5, fy=0.5 | half as wide, half as tall | circle green
```

## [explanation] Two ways to give the size, and interpolation

- **A size**, `(new_w, new_h)`: you choose the exact width and height.
- **Scale factors**, `None, fx=0.5, fy=0.5`: the size is `None` and `fx` and `fy` multiply the width and the height. Using the same number for both keeps the ratio.

When an image is resized, new pixel values have to be calculated from the old ones. That calculation is called **interpolation**. The default, `cv2.INTER_LINEAR`, is fine for most work. OpenCV's own documentation recommends `cv2.INTER_AREA` for shrinking and `cv2.INTER_CUBIC` (slower) or `cv2.INTER_LINEAR` for enlarging.

## [note] Check yourself

::: check What is the shape of `cv2.resize(img, (300, 200))` for a colour image?
???
**`(200, 300, 3)`**: 200 rows (height) and 300 columns (width). `resize` takes (width, height) but `shape` lists the height first.
:::

::: check A photo is 1280 × 720. You want it 320 pixels wide without stretching. What height do you use?
???
**180**: 720 × 320 ÷ 1280 = 180. Or use `fx=0.25, fy=0.25`, since 320 is a quarter of 1280.
:::

## [common_mistakes] Common mistakes

- **Giving (height, width).** `cv2.resize(img, (480, 640))` makes a **tall** image, 480 wide and 640 tall.
- **Decimal sizes.** `cv2.resize(img, (640, 360.0))` stops with an error. Wrap calculated sizes in `int()`.
- **Stretching by accident.** A fixed size with a different ratio distorts shapes; calculate the height if shapes matter.
- **Enlarging to get detail.** Making a small image bigger adds pixels, not detail: the result looks soft or blocky.

## [key_takeaways] Key takeaways

- `cv2.resize(img, (width, height))`: **width first**, unlike `shape`.
- Smaller images are faster to process and use less memory.
- Keep the aspect ratio: new height = old height × new width ÷ old width, or use `fx` and `fy`.
- `cv2.INTER_AREA` is a good choice for shrinking.
