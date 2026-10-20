---
slug: histogram-equalization
title: Improving contrast automatically
topic: image-enhancement
lecture: 2
difficulty: medium
description: Read an image's histogram, see why a low-contrast image has its values bunched together, and spread them out automatically with histogram equalization.
objectives:
  - Explain what an image histogram shows
  - Recognise a low-contrast image from its histogram and its minimum and maximum values
  - Improve contrast automatically with cv2.equalizeHist
  - Say why equalization works on grayscale images and what it can't do
prerequisites:
  - Colour to grayscale
  - Brightness and contrast
related:
  - brightness-and-contrast
  - enhancement-pipeline-and-challenge
updated: 2026-10-15
---

## [explanation] What is a histogram?

An image's **histogram** counts how many pixels have each value: how many are 0, how many are 1, and so on up to 255. Drawn as a bar chart, it shows at a glance how the brightness is spread:

| Histogram shape | The image looks… |
|---|---|
| bars bunched on the **left** | dark |
| bars bunched on the **right** | bright |
| bars bunched in a **narrow** band | flat, low contrast (foggy, washed out) |
| bars spread **across the whole range** | good contrast |

In the last lessons you changed contrast by hand with alpha and beta. **Histogram equalization** does it automatically: it spreads the values so they use the whole range from 0 to 255.

## [code] Step 10: histogram equalization

To have a low-contrast image to fix, the program first makes one: it squeezes the street's grey values into a narrow band, like a photo taken in fog.

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(
    img,
    cv2.COLOR_BGR2GRAY
)
foggy = cv2.convertScaleAbs(gray, alpha=0.3, beta=100)
equalized = cv2.equalizeHist(foggy)
print("before:", foggy.min(), "to", foggy.max())
print("after:", equalized.min(), "to", equalized.max())
cv2.imshow("Original", foggy)
cv2.imshow("Equalized", equalized)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
before: 100 to 175
after: 0 to 255
```

```notes
4 | cvtColor | grayscale first | circle sky
8 | alpha=0.3, beta=100 | squeeze: a foggy copy | tri coral
9 | equalizeHist | spread the values | square yel
10 | foggy.min() | darkest value | diamond green
```

## [diagram] Before and after, with their histograms

![Two grayscale versions of the street scene with their histograms underneath. Before: a flat, foggy image whose histogram bars all sit between 100 and 175. After equalization: a high-contrast image with black windows, a dark, strongly textured road, light bands in the sky and white lane lines, whose histogram bars spread from 0 to 255](images/cv-equalize.png)

## [explanation] What changed

Before, every pixel was between **100 and 175**: only 76 possible greys, all of them medium, so everything looked grey and foggy. After equalization the values run from **0 to 255**: the darkest parts are black, the brightest are white, and the details in between are easier to see. Look at the grass and the road too: equalization made their texture much stronger, and the smooth sky now shows bands. It spreads whatever is there, wanted or not.

Equalization is **automatic**: you don't choose alpha and beta. It looks at the histogram and moves crowded values apart and rare values together, so that, roughly, every brightness level is used about equally often.

**It spreads pixel intensities to improve contrast.** Low-contrast input becomes much clearer.

## [explanation] What equalization can't do

- **It can't add detail.** It only moves existing values. Two pixels that had the same value still have the same value afterwards (in fact some neighbouring levels get merged).
- **It works on one channel.** `cv2.equalizeHist()` needs a grayscale (8-bit, single-channel) image. A colour image gives an error, which is why the program converts to grayscale first.
- **It can overdo it.** On an image that already has good contrast it may make noise or flat areas look harsh. Use it when the histogram is bunched.

## [note] Check yourself

::: check A grayscale image has `img.min()` equal to 30 and `img.max()` equal to 60. Does it need more contrast?
???
**Yes.** All its values sit in a band only 31 greys wide (30 to 60), so it is very dark **and** flat. Its histogram is a narrow spike on the left; equalization would spread it over 0 to 255.
:::

::: check What happens with `cv2.equalizeHist(img)` when `img` was read in colour?
???
OpenCV stops with an error (an assertion that the input is a single-channel 8-bit image). Convert first: `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`.
:::

## [common_mistakes] Common mistakes

- **Passing a colour image.** `equalizeHist` needs grayscale.
- **Expecting new detail.** Equalization spreads values; it can't recover detail that was never captured.
- **Equalizing a noisy image.** Spreading the values also spreads the noise. Denoise first; the pipeline in the next lesson does exactly that.

## [key_takeaways] Key takeaways

- A histogram counts the pixels at each brightness from 0 to 255.
- Low contrast means the histogram is bunched in a narrow band.
- `cv2.equalizeHist(gray)` spreads the values over the whole range automatically.
- It needs a grayscale image and works best on flat, foggy or dull images.
