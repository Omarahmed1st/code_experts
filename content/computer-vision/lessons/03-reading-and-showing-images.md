---
slug: reading-and-showing-images
title: Getting started with OpenCV
topic: reading-and-displaying-images
lecture: 2
difficulty: easy
description: Install OpenCV, read an image from a file, show it in a window and print its shape. The first step of every lab, and the start of the image enhancement lecture.
objectives:
  - Install OpenCV with pip and import it as cv2
  - Read an image with cv2.imread and check that it loaded
  - Show an image with cv2.imshow, cv2.waitKey and cv2.destroyAllWindows
  - Read an image's height, width and channels from img.shape
prerequisites:
  - What is computer vision?
related:
  - digital-images-and-pixels
  - grayscale-images
updated: 2026-10-15
---

## [explanation] If an image is only numbers…

Last lecture ended with a question: if an image is only numbers, **can we change the image by changing these numbers?** Yes. That is what this lecture does, with Python and OpenCV, in eleven steps:

| Step | You will… |
|---|---|
| 1 | read an image |
| 2 | look at its properties |
| 3 | convert it to grayscale |
| 4 | resize it |
| 5, 6 | change its brightness and contrast |
| 7, 8 | blur it and remove noise |
| 9 | sharpen it |
| 10 | improve its contrast automatically (histogram equalization) |
| 11 | solve a mini challenge: fix a bad image |

## [explanation] Getting started with OpenCV

**OpenCV** (Open Source Computer Vision Library) is a free library with thousands of image functions. Install it once, from a terminal (Command Prompt on Windows):

```text
pip install opencv-python
```

Then, in every Python file that uses it:

```python
import cv2
```

`cv2` is the module name you will write in front of every OpenCV function. These are the ones this lecture uses:

| Function | What it does |
|---|---|
| `cv2.imread()` | loads an image from a file |
| `cv2.imshow()` | displays an image in a window |
| `cv2.resize()` | changes an image's size |
| `cv2.cvtColor()` | converts between colour formats |
| `cv2.GaussianBlur()` | smooths an image |
| `cv2.equalizeHist()` | improves contrast automatically |

OpenCV programs open windows on your screen, so they run on your own computer, not in the browser. The programs on these pages show their recorded output instead of a Run button.

## [diagram] The image used in these labs

![A drawn street scene, 960 by 540 pixels: four city buildings with grids of windows on the left, two grey mountains with snow caps, a road with white edge lines and a dashed yellow centre line, a red car, a person crossing, a stop sign, a house and a tree on the right](images/street.png)

This is `street.png`, 960 pixels wide and 540 pixels tall. Download it with the link under the picture and save it **in the same folder as your Python file**. You can also use a photo of your own: change the file name in the code.

## [code] Step 1: read and show an image

```python program
import cv2

img = cv2.imread("street.png")
cv2.imshow("Original Image", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```notes
3 | imread | loads the image | circle sky
4 | imshow | displays it | square yel
5 | waitKey(0) | waits for a key | diamond green
6 | destroyAllWindows | closes the windows | tri coral
```

## [explanation] What each line does

| Line | What it does |
|---|---|
| `img = cv2.imread("street.png")` | **loads** the image from the file into the variable `img` |
| `cv2.imshow("Original Image", img)` | **displays** `img` in a window whose title is "Original Image" |
| `cv2.waitKey(0)` | **waits** until you press any key; 0 means "wait forever" |
| `cv2.destroyAllWindows()` | **closes** all the windows OpenCV opened |

Without `waitKey()`, the window would open and close in a blink, or stay grey and frozen: OpenCV only draws its windows while it waits for a key.

## [diagram] The window it opens

![A window titled Original Image showing the street scene](images/cv-window-original.png)

Press any key while the window is selected to close it and end the program.

## [code] Did the image load?

If the file name is wrong, or the file isn't in the same folder, `imread()` does **not** stop with an error. It returns `None`, and the program fails one line later with a confusing message. Check straight after reading. (OpenCV may also print its own warning line about the file.)

```python program
import cv2

img = cv2.imread("stret.png")
if img is None:
    print("Could not read the image. Check the file name and folder.")
else:
    print("Loaded:", img.shape)
```

```output
Could not read the image. Check the file name and folder.
```

```notes
3 | stret.png | a typo in the name | tri coral
4 | img is None | nothing was loaded | circle sky
```

## [explanation] Step 2: images are arrays

`img` is a NumPy **array**: a grid of numbers with a **shape**. Print the shape to learn the image's size:

```python
print(img.shape)
```

For `street.png` it prints `(540, 960, 3)`:

| Number | Meaning |
|---|---|
| 540 | **height**: the number of rows of pixels |
| 960 | **width**: the number of columns |
| 3 | **colour channels**: three numbers per pixel |

The order is always **height × width × channels**. Height comes first.

## [code] Printing the properties

```python program
import cv2

img = cv2.imread("street.png")
print(img.shape)
height, width, channels = img.shape
print("Width:", width)
print("Height:", height)
print("Channels:", channels)
```

```output
(540, 960, 3)
Width: 960
Height: 540
Channels: 3
```

```notes
4 | img.shape | (height, width, channels) | circle sky
5 | height, width, channels | three variables at once | square yel
```

## [explanation] OpenCV uses BGR, not RGB

The three channels are **B**lue, **G**reen and **R**ed, **in that order**. Most other tools say RGB, so OpenCV's order surprises everyone once:

| Channel | Colour |
|---|---|
| 0 | B: blue |
| 1 | G: green |
| 2 | R: red |

So in OpenCV `(0, 0, 255)` is **red** and `(255, 0, 0)` is **blue**. The next lesson looks at single pixels in detail.

## [explanation] Student task 1: try it yourself

Write this in your own Python file:

1. Choose any image (a photo from your phone works).
2. Load it with OpenCV.
3. Display it.
4. Print its shape.

Then answer: **What is the width? What is the height? How many channels?** Remember that the shape lists the height first.

## [note] Check yourself

::: check A program prints `(720, 1280, 3)` for `img.shape`. How wide is the image?
???
**1280 pixels.** The shape is (height, width, channels), so the height is 720 and the width is 1280.
:::

## [common_mistakes] Common mistakes

- **The image is not in the same folder.** `imread()` returns `None`; check with `if img is None:`.
- **Forgetting `waitKey()`.** The window flashes or stays grey. Always call `cv2.waitKey(0)` after `imshow()`.
- **Reading the shape as width × height.** It is **height × width × channels**.
- **Expecting RGB.** OpenCV stores **BGR**: red is `(0, 0, 255)`.
- **Naming your own file `cv2.py`.** Then `import cv2` imports your file instead of OpenCV. Give your files other names.

## [key_takeaways] Key takeaways

- Install with `pip install opencv-python`; use it with `import cv2`.
- `imread` loads, `imshow` displays, `waitKey` waits for a key, `destroyAllWindows` closes.
- `imread` returns `None` for a missing file, so check it.
- `img.shape` is **(height, width, channels)**, and colour images are stored as **BGR**.
