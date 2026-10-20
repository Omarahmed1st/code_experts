---
slug: digital-images-and-pixels
title: Digital images and pixels
topic: digital-images
lecture: 2
difficulty: easy
description: See what an image really is to a computer, a grid of numbers, and use OpenCV to read an image, check its size and read or change single pixels.
objectives:
  - Describe an image as a grid of pixels, each holding numbers
  - Read an image with cv2.imread and check its shape and data type
  - Read one pixel and explain OpenCV's BGR channel order
  - Change a block of pixels with slicing and save the result
prerequisites:
  - Getting started with OpenCV
  - "Python Lists and indexing (Programming Applications course)"
related:
  - reading-and-showing-images
  - grayscale-images
  - brightness-and-contrast
updated: 2026-10-15
---

## [explanation] An image is a grid of numbers

To a computer, a picture is a **grid of tiny squares** called **pixels** (short for "picture elements"). Each pixel stores numbers that say what colour it is.

- In a **grayscale** image each pixel holds **one** number, from `0` (black) to `255` (white).
- In a **colour** image each pixel holds **three** numbers: how much blue, green and red light it has, each from `0` to `255`.

So a colour image that is 240 pixels wide and 160 pixels tall is really 160 × 240 × 3 = 115,200 numbers. Everything in computer vision, from blurring to recognising faces, is done by working on those numbers.

## [diagram] The image used in this lesson

![A dark navy rectangle, 240 by 160 pixels, with a yellow filled circle on the left and a light-blue filled square on the right](images/shapes.png)

This is `shapes.png`: 240 pixels wide and 160 pixels tall. Download it with the link under the picture and save it next to your Python file to run the examples on your own computer.

## [code] Reading an image with OpenCV

`cv2.imread()` loads an image file into a NumPy array, the grid of numbers described above.

```python program
import cv2

img = cv2.imread("shapes.png")
print(type(img))
print(img.shape)
print(img.dtype)
```

```output
<class 'numpy.ndarray'>
(160, 240, 3)
uint8
```

```notes
3 | cv2.imread | loads the file | circle sky
5 | img.shape | rows, columns, channels | square yel
6 | img.dtype | 8-bit numbers: 0 to 255 | diamond green
```

## [explanation] Reading the shape: rows first

`img.shape` is `(160, 240, 3)`, in this order:

| Position | Value | Meaning |
|---|---|---|
| `shape[0]` | 160 | number of **rows** (the height) |
| `shape[1]` | 240 | number of **columns** (the width) |
| `shape[2]` | 3 | number of **channels** (blue, green, red) |

Height comes **before** width. A handy line for later: `h, w = img.shape[:2]`.

The data type `uint8` means "unsigned 8-bit integer": whole numbers from 0 to 255, which is exactly the range of one colour channel.

## [diagram] Zooming in on the circle's edge

![A zoomed-in 4 by 4 grid of pixels at the left edge of the yellow circle. Navy cells show B 61, G 33, R 20; yellow cells show B 59, G 212, R 255. Each cell is labelled with its row and column](images/pixel-grid.png)

Each cell above is **one pixel**, labelled `[row,column]`. The navy pixels hold `B 61, G 33, R 20` and the yellow ones hold `B 59, G 212, R 255`.

## [code] Reading one pixel

You read a pixel with `img[row, column]`. For a colour image you get three numbers back.

```python program
import cv2

img = cv2.imread("shapes.png")
print(img[0, 0])
print(img[80, 70])
b, g, r = img[80, 70]
print("red:", r)
```

```output
[61 33 20]
[ 59 212 255]
red: 255
```

```notes
4 | img[0, 0] | top-left pixel | circle sky
5 | img[80, 70] | row 80, column 70 | square yel
6 | b, g, r | the order is B, G, R | tri coral
```

## [explanation] Why BGR and not RGB?

Most tools list colours as **R**ed, **G**reen, **B**lue. OpenCV stores them the other way round: **B**lue, **G**reen, **R**ed. That's why the yellow pixel prints as `[ 59 212 255]`: very little blue, a lot of green and full red, which our eyes see as yellow.

This matters when you mix OpenCV with other libraries. Showing an OpenCV image with a library that expects RGB swaps red and blue, so yellow looks light blue. Convert first with `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`.

## [diagram] The three channels, one at a time

![The shapes image split into three grey images labelled channel 0 B, channel 1 G and channel 2 R. The square is bright in the blue channel, the circle is brightest in the red channel](images/bgr-channels.png)

Each channel on its own is a grayscale image. The light-blue square is bright in channel 0 (blue); the yellow circle is almost dark in channel 0 but fully bright in channel 2 (red).

## [code] Grayscale: one number per pixel

Pass `cv2.IMREAD_GRAYSCALE` to load the image with a single channel. The third number disappears from the shape.

```python program
import cv2

gray = cv2.imread("shapes.png", cv2.IMREAD_GRAYSCALE)
print(gray.shape)
print(gray[80, 70])
print(gray[0, 0])
```

```output
(160, 240)
207
32
```

```notes
3 | cv2.IMREAD_GRAYSCALE | load as grey | circle sky
4 | gray.shape | no channel number | square yel
```

## [note] Check yourself

::: check An image's shape is `(480, 640, 3)`. How wide is it, and what does `img[479, 639]` give you?
???
It is **640 pixels wide** and 480 pixels tall, because the shape lists rows (height) first. `img[479, 639]` is the **bottom-right pixel**: its three numbers in B, G, R order. Row 479 and column 639 are the last ones, since indexes start at 0.
:::

## [code] Changing a block of pixels

Because an image is a NumPy array, slicing works on it like on a List, with one slice for the rows and one for the columns. Assigning a colour to a slice paints that whole block.

```python program
import cv2

img = cv2.imread("shapes.png")
img[10:30, 10:30] = (255, 255, 255)
print(img[20, 20])
cv2.imwrite("marked.png", img)
```

```output
[255 255 255]
```

```notes
4 | 10:30, 10:30 | rows 10-29, columns 10-29 | circle sky
4 | (255, 255, 255) | white in B, G, R | square yel
6 | cv2.imwrite | saves to a new file | diamond green
```

## [diagram] The saved file

![The shapes image with a small white square painted in the top-left corner](images/marked.png)

`marked.png` has a 20 × 20 white square in the top-left corner. The original `shapes.png` is unchanged, because `imwrite` wrote a new file.

## [common_mistakes] Common mistakes

- **A wrong file name gives `None`, not an error.** `cv2.imread("shape.png")` (missing *s*) returns `None` and OpenCV only prints a warning. The program fails later with a confusing message such as `'NoneType' object has no attribute 'shape'`. Check with `if img is None:` straight after reading.
- **Swapping x and y.** Pixels are `img[row, column]`, which is `img[y, x]`. Many drawing functions, such as `cv2.circle(img, (x, y), …)`, take **x first**. Mixing the two puts things in the wrong place.
- **Forgetting BGR.** `(255, 0, 0)` is **blue** in OpenCV, not red. Red is `(0, 0, 255)`.
- **Values above 255.** A `uint8` channel can't hold 256 or more. The next lesson shows what happens when a calculation goes past 255.

## [key_takeaways] Key takeaways

- An image is a grid of pixels; in OpenCV it's a NumPy array with shape `(rows, columns, channels)`.
- `uint8` pixels hold whole numbers from 0 to 255.
- `img[row, column]` reads a pixel; colour pixels come back in **B, G, R** order.
- Slicing (`img[10:30, 10:30] = …`) changes a whole block; `cv2.imwrite` saves the result.
- Always check that `cv2.imread` didn't return `None`.
