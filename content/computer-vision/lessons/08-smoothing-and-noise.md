---
slug: smoothing-and-noise
title: Blurring and removing noise
topic: noise-reduction
lecture: 2
difficulty: medium
description: Smooth an image with a Gaussian blur, compare the average, Gaussian and median filters, and remove salt-and-pepper noise with a median blur. Measure which filter really helps.
objectives:
  - Blur an image with cv2.GaussianBlur and choose a kernel size
  - Explain how a filter computes each new pixel from its neighbours
  - Compare cv2.blur, cv2.GaussianBlur and cv2.medianBlur on a noisy image
  - Remove salt-and-pepper noise with cv2.medianBlur
prerequisites:
  - Brightness and contrast
related:
  - brightness-and-contrast
  - sharpening-images
updated: 2026-10-15
---

## [explanation] Image smoothing

**Blurring** (or smoothing) makes each pixel more like its neighbours. Small details and small random changes fade, while large shapes stay.

Why would we want a blurrier image? Because cameras add **noise**: unwanted random changes in pixel values, especially in dim light. Noise confuses later steps; for example, an edge detector reports every noisy speck as an edge. A little blur before those steps removes most of it.

## [code] Step 7: a Gaussian blur

```python program
import cv2

img = cv2.imread("street.png")
blur = cv2.GaussianBlur(
    img,
    (5, 5),
    0
)
cv2.imshow("Original", img)
cv2.imshow("Blurred", blur)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```notes
4 | GaussianBlur | smooth the image | circle sky
6 | (5, 5) | kernel: 5 × 5 neighbours | square yel
7 | 0 | let OpenCV pick the spread | diamond green
```

## [explanation] What the arguments mean

| Argument | Meaning |
|---|---|
| `img` | the image to blur |
| `(5, 5)` | the **kernel size**: each new pixel is computed from a 5 × 5 square of neighbours around it |
| `0` | how widely the weights spread (sigma); 0 tells OpenCV to calculate it from the kernel size |

The kernel width and height must be **odd** (3, 5, 7…), so the kernel has a centre pixel. Try `(3, 3)`, `(5, 5)` and `(15, 15)`: a **larger kernel gives more blur**.

## [diagram] Kernel sizes (3, 3), (5, 5) and (15, 15)

![Four close-ups of the same part of the street scene, a building's windows and the edge of the grass. The original is sharp. With a 3 by 3 kernel it is slightly soft, with 5 by 5 softer, and with 15 by 15 the windows have melted into blurry blobs](images/cv-gaussian-sizes.png)

These are close-ups of the top-left part of the image, enlarged so you can see the difference.

## [explanation] How a filter computes a pixel

All three smoothing filters in this lecture slide a small window (the kernel) over the image. For **every** pixel, they look at the pixel and its neighbours, and compute one new value:

| Filter | Code | New value |
|---|---|---|
| **Average** | `cv2.blur(img, (5, 5))` | the plain average of the 25 neighbours |
| **Gaussian** | `cv2.GaussianBlur(img, (5, 5), 0)` | a weighted average: near neighbours count more than far ones |
| **Median** | `cv2.medianBlur(img, 5)` | the **middle** value after sorting the 25 neighbours |

The median is different from the other two: it doesn't calculate a new value, it **picks** one of the existing ones. That matters a lot for some kinds of noise.

## [code] Average or median? Try it on 9 numbers

This program runs in your browser. The nine numbers are a 3 × 3 patch of a grey area (values near 13) hit by one white dot (255) and one black dot (0).

```python program run
import statistics

patch = [12, 14, 13,
         15, 255, 11,
         0, 14, 13]

print("average:", round(sum(patch) / len(patch), 1))
print("median:", statistics.median(patch))
```

```output
average: 38.6
median: 13
```

```notes
4 | 255 | a white dot (noise) | tri coral
5 | 0 | a black dot (noise) | tri coral
7 | sum(patch) / len(patch) | pulled up by the 255 | square yel
8 | statistics.median | the middle value | diamond green
```

## [explanation] Why the median wins here

Sorted, the nine values are 0, 11, 12, 13, **13**, 14, 14, 15, 255. The median is the fifth one, **13**: a normal grey value. The two extreme values sit at the ends of the sorted list and are simply ignored.

The average adds everything up, so the single 255 drags it to **38.6**, nearly three times too bright. An average filter doesn't remove a white dot; it spreads it into a lighter smudge.

## [explanation] Image noise: salt and pepper

**Noise = unwanted random pixels.** One common kind is **salt-and-pepper noise**: random pixels turned pure white (salt) or pure black (pepper), for example by a faulty sensor or transmission errors. The next image has it: 4% of its pixels are salt or pepper.

## [diagram] The noisy image

![The street scene at 640 by 360 pixels, covered in thousands of scattered pure white and pure black dots](images/noisy-street.png)

This is `noisy-street.png`. Download it to run the next two programs.

## [code] Removing salt and pepper with a median blur

```python program
import cv2
import numpy as np

noisy_img = cv2.imread("noisy-street.png")
clean = cv2.medianBlur(
    noisy_img,
    5
)
gray = cv2.cvtColor(noisy_img, cv2.COLOR_BGR2GRAY)
print("dots before:", np.count_nonzero((gray == 0) | (gray == 255)))
gray = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY)
print("dots after:", np.count_nonzero((gray == 0) | (gray == 255)))
cv2.imshow("Noisy Image", noisy_img)
cv2.imshow("Cleaner Image", clean)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
dots before: 9192
dots after: 0
```

```notes
5 | medianBlur | middle value of 5 × 5 | circle sky
7 | 5 | one number: always square | square yel
10 | count_nonzero | count black or white pixels | diamond green
```

## [diagram] Noisy and cleaner

![Two windows. Noisy Image shows the street covered in white and black dots. Cleaner Image shows the same street with no dots at all; it is softer, and small details such as the STOP letters and the grass texture are smoothed away](images/cv-median.png)

`medianBlur` takes a single number, the kernel size (odd, and the kernel is always square). Every one of the 9,192 dots is gone, because each dot is an extreme value in its neighbourhood. **The median blur works very well with salt-and-pepper noise.** The price: a 5 × 5 median also smooths away small details, such as the letters on the STOP sign. `cv2.medianBlur(noisy_img, 3)` keeps more detail; try both.

## [code] Which filter helps most?

We can measure it. `noisy-street.png` was made from `street.png`, so we can rebuild the clean version and check how far each result is from it. `cv2.absdiff` gives the difference of every value; its average is the **average error**: smaller is better.

```python program
import cv2

clean = cv2.resize(cv2.imread("street.png"), (640, 360), interpolation=cv2.INTER_AREA)
noisy = cv2.imread("noisy-street.png")

average = cv2.blur(noisy, (5, 5))
gaussian = cv2.GaussianBlur(noisy, (5, 5), 0)
median = cv2.medianBlur(noisy, 5)

for name, result in [("noisy", noisy), ("average", average), ("gaussian", gaussian), ("median", median)]:
    error = cv2.absdiff(result, clean).mean()
    print(name, round(error, 1))
```

```output
noisy 5.1
average 8.2
gaussian 7.0
median 2.8
```

```notes
3 | cv2.resize | the clean 640 × 360 version | circle sky
6 | cv2.blur | average filter | square yel
11 | absdiff | difference per value | diamond green
```

## [diagram] Four results side by side

![Four close-ups of the noisy street image. Original: sharp, with white and black dots. Average: blurry, with grey smudges where the dots were. Gaussian: a little sharper than the average, still with smudges. Median: clean, with no dots and sharp edges](images/cv-filters.png)

## [explanation] Reading the results

The average and Gaussian filters made the image **worse** than doing nothing (8.2 and 7.0 against 5.1). They blur the real details and smear every dot into a smudge instead of removing it. The median filter more than halves the error (2.8).

That doesn't make the median the best filter for everything. Real camera noise is usually **many small changes** on every pixel rather than a few extreme dots, and for that kind a Gaussian blur works well and is fast. Pick the filter for the noise you have:

| Noise | Good choice |
|---|---|
| salt and pepper (isolated black and white dots) | `cv2.medianBlur` |
| fine grain on every pixel | `cv2.GaussianBlur` |

## [note] Check yourself

::: check What does `cv2.GaussianBlur(img, (4, 4), 0)` do?
???
It stops with an error: the kernel size must be **odd**, such as (3, 3) or (5, 5), so that the kernel has a centre pixel.
:::

::: check Five neighbours have the values 10, 200, 12, 11, 13. What is their median, and what is their average?
???
Sorted: 10, 11, **12**, 13, 200, so the median is **12**. The average is 246 ÷ 5 = **49.2**, dragged up by the 200.
:::

## [common_mistakes] Common mistakes

- **Even kernel sizes.** `(4, 4)` or `medianBlur(img, 4)` stop with an error. Use odd numbers.
- **Too much blur.** A `(15, 15)` kernel removes noise and the details you wanted to keep. Use the smallest kernel that works.
- **Using an average blur on salt and pepper.** It turns dots into smudges. Use the median.
- **Passing a tuple to medianBlur.** `cv2.medianBlur(img, (5, 5))` is an error: it takes one number.

## [key_takeaways] Key takeaways

- Blurring makes each pixel more like its neighbours and removes small noise.
- `cv2.GaussianBlur(img, (k, k), 0)`: a larger odd `k` gives more blur.
- Average and Gaussian filters compute a (weighted) mean; the median filter picks the middle value.
- `cv2.medianBlur(img, 5)` removes salt-and-pepper noise almost completely.
