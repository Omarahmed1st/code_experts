---
slug: cvp-grayscale-flag
type: mcq
multiple: true
title: Load an image straight in grayscale
lesson: grayscale-images
difficulty: medium
updated: 2026-10-16
---

## Question

Which lines load `street.png` **directly as a grayscale image**? Pick **all** that do.

## Options

- [x] `gray = cv2.imread("street.png", cv2.IMREAD_GRAYSCALE)`
  Right: the flag asks `imread` for one channel.
- [x] `gray = cv2.imread("street.png", 0)`
  Right: 0 is the value of `cv2.IMREAD_GRAYSCALE`. The named version is easier to read.
- [ ] `gray = cv2.imread("street.png")`
  With no flag, `imread` loads the colour image, with 3 channels.
- [ ] `gray = cv2.cvtColor("street.png", cv2.COLOR_BGR2GRAY)`
  `cvtColor` converts an image that is already loaded. It doesn't read files: it needs the array from `imread`.

## Explanation

There are two ways to get a grayscale image:

1. Load it in grayscale: `cv2.imread(name, cv2.IMREAD_GRAYSCALE)`, or the same with `0`.
2. Load it in colour, then convert: `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`.

The two ways can round some pixels 1 grey level apart, so don't mix them in one experiment.
