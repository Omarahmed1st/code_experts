---
slug: grayscale-images
title: Colour to grayscale
topic: pixels-and-color-channels
lecture: 2
difficulty: easy
description: Convert a colour image to grayscale with cv2.cvtColor, see why the channel number disappears from the shape, and work out how three colour values become one grey value.
objectives:
  - Convert a BGR image to grayscale with cv2.cvtColor
  - Explain why a grayscale shape has two numbers instead of three
  - Calculate a pixel's grey value from its B, G and R values
  - Say why many computer vision steps work on grayscale images
prerequisites:
  - Getting started with OpenCV
  - Digital images and pixels
related:
  - digital-images-and-pixels
  - resizing-images
updated: 2026-10-15
---

## [explanation] Why grayscale?

A colour image stores **3 numbers per pixel** (blue, green, red). A grayscale image stores **1**: how bright the pixel is, from 0 (black) to 255 (white).

Many computer vision steps only need brightness. Edges, corners and textures are changes in brightness, so colour adds little but triples the data to process. That is why most pipelines in this course start by converting to grayscale.

| Image | Channels | Numbers per pixel |
|---|---|---|
| Colour | 3 (B, G, R) | 3 |
| Grayscale | 1 | 1 |

## [code] Step 3: convert to grayscale

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(
    img,
    cv2.COLOR_BGR2GRAY
)
cv2.imshow("Original", img)
cv2.imshow("Grayscale", gray)
print(img.shape)
print(gray.shape)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
(540, 960, 3)
(540, 960)
```

```notes
4 | cvtColor | convert colour | circle sky
6 | COLOR_BGR2GRAY | from BGR to grey | square yel
11 | gray.shape | only two numbers | diamond green
```

## [diagram] Two windows: colour and grayscale

![Two windows side by side. Original shows the colour street scene. Grayscale shows the same scene in shades of grey: the red car is a mid grey, the yellow sun a light grey and the road a darker grey](images/cv-grayscale.png)

## [explanation] Where did the 3 go?

The colour shape is `(540, 960, 3)`; the grayscale shape is `(540, 960)`. There is **no channel dimension** any more, because each pixel is a single number. Reading a pixel shows the difference:

| Code | Colour image `img` | Grayscale image `gray` |
|---|---|---|
| `[420, 600]` (on the car) | `[ 60  60 200]` | `102` |

`cv2.cvtColor()` can convert between many formats. The **code** in its second argument says which: `COLOR_BGR2GRAY` means "from BGR to grey". Its opposite, `COLOR_GRAY2BGR`, turns a grey image back into 3 channels, but the colour is gone for good: all three channels get the same grey value.

## [explanation] How three numbers become one

OpenCV does **not** simply take the average of B, G and R. Our eyes are most sensitive to green and least to blue, so each channel gets its own weight:

**grey = 0.299 × R + 0.587 × G + 0.114 × B**

For the car pixel, B = 60, G = 60 and R = 200:

0.299 × 200 + 0.587 × 60 + 0.114 × 60 = 59.8 + 35.22 + 6.84 = **101.86**, stored as **102**.

So a bright red car becomes a fairly **dark** grey: red light counts for less than green.

## [code] Checking the formula on one pixel

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
b, g, r = img[420, 600]
print("B, G, R:", b, g, r)
print("formula:", round(0.299 * r + 0.587 * g + 0.114 * b, 2))
print("OpenCV:", gray[420, 600])
```

```output
B, G, R: 60 60 200
formula: 101.86
OpenCV: 102
```

```notes
5 | b, g, r | B first: OpenCV order | circle sky
7 | 0.299 * r | each channel has a weight | square yel
8 | gray[420, 600] | one number, rounded | diamond green
```

## [explanation] Loading in grayscale directly

If you only need grayscale, you can ask `imread()` for it and skip `cvtColor()`:

```python
gray = cv2.imread("street.png", cv2.IMREAD_GRAYSCALE)
```

You will also see `cv2.imread("street.png", 0)`: the `0` is the value of `cv2.IMREAD_GRAYSCALE`. The named version is easier to read. The two ways don't round in exactly the same way: when we tried both on `street.png`, most pixels came out 1 grey level apart. That is invisible, but it changes printed numbers, so don't mix the two ways in one experiment.

## [note] Check yourself

::: check A pixel is pure green in OpenCV: `(0, 255, 0)`. Roughly what grey value does it get?
???
About **150**: 0.587 × 255 ≈ 149.7. Pure blue `(255, 0, 0)` would only get about 29 (0.114 × 255), which is why blue things look dark in grayscale.
:::

::: check A grayscale image has shape `(480, 640)`. What does `gray[0, 0]` give?
???
**One number** from 0 to 255: the brightness of the top-left pixel. There is no list of three, because a grayscale image has only one channel.
:::

## [common_mistakes] Common mistakes

- **`COLOR_RGB2GRAY` on an OpenCV image.** OpenCV images are BGR, so this swaps the weights of red and blue. Use `COLOR_BGR2GRAY`.
- **Unpacking three values from a grey shape.** `h, w, c = gray.shape` fails with `ValueError: not enough values to unpack`. Use `h, w = gray.shape`.
- **Expecting the colour back.** `COLOR_GRAY2BGR` gives three equal channels, not the original colours. Keep the colour image in its own variable.

## [key_takeaways] Key takeaways

- `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)` converts colour to grayscale.
- A grayscale shape is `(height, width)`: **no channel dimension**.
- grey = 0.299 R + 0.587 G + 0.114 B, so green counts most and blue least.
- Most edge and feature methods work on grayscale images.
