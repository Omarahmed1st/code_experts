---
slug: feature-matching
title: Matching features between two images
topic: feature-matching
lecture: 3
difficulty: hard
description: Match ORB features between two views of the same street with a brute-force matcher, keep the best matches, and measure how lighting, blur, angle, occlusion and scale make matching harder.
objectives:
  - Explain what feature matching is and what a wrong match is
  - Match ORB descriptors with cv2.BFMatcher, NORM_HAMMING and crossCheck
  - Sort matches by distance and draw the best ones with cv2.drawMatches
  - Measure how changes to the second image reduce the number of good matches
prerequisites:
  - ORB keypoints and descriptors
related:
  - orb-keypoints-and-descriptors
  - jetson-vision-vehicle
updated: 2026-10-15
---

## [explanation] What is feature matching?

Feature matching answers one question: **which feature in image A shows the same real-world point as a feature in image B?**

ORB finds keypoints and descriptors in **both** images. Matching compares the descriptors (the fingerprints): two keypoints whose descriptors have almost the same bits probably show the same point.

Matching can go wrong. If a keypoint on the car in image A were matched to a window in image B, that would be a **wrong match**: the two patches only look alike. That is why we keep only the **best** matches.

## [diagram] View A

![The street seen from the first camera position: buildings on the left, the road, the car, the stop sign, and part of the house at the right edge](images/view-a.png)

`view-a.png` and `view-b.png` are two views of the same street, as if the camera moved to the right and turned a little between the two photos. Download both to run the programs below.

## [diagram] View B

![The street seen from the second camera position: shifted to the right and slightly tilted, with the whole house, the tree edge and the sun visible on the right](images/view-b.png)

## [code] Feature matching with ORB

```python program
import cv2

img1 = cv2.imread("view-a.png", 0)
img2 = cv2.imread("view-b.png", 0)
orb = cv2.ORB_create()
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = bf.match(des1, des2)
matches = sorted(matches, key=lambda x: x.distance)
print(len(matches), "matches")
print("best distance:", matches[0].distance)
print("30th best:", matches[29].distance)
result = cv2.drawMatches(img1, kp1, img2, kp2,
                         matches[:30], None)
cv2.imshow("Feature Matches", result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
303 matches
best distance: 1.0
30th best: 7.0
```

```notes
3 | 0) | 0 = load in grayscale | circle sky
6 | detectAndCompute | features in both images | square yel
8 | BFMatcher | compare every pair | diamond green
8 | NORM_HAMMING | count differing bits | tri sky
8 | crossCheck=True | both must agree | circle green
10 | sorted | most similar first | square sky
15 | matches[:30] | draw the best 30 | diamond yel
```

## [diagram] The best 30 matches

![A window titled Feature Matches with view A on the left and view B on the right. Thirty coloured lines join small circles in A to circles in B: on the windows, the mountain tops, the stop sign and the car. The lines run almost horizontally, slanting slightly because the camera moved sideways and turned](images/cv-matches.png)

## [explanation] Walking through the code

1. **Read in grayscale.** The flag `0` in `cv2.imread(…, 0)` loads each image as grayscale directly.
2. **Detect and describe.** The same ORB detector finds keypoints and descriptors in both images.
3. **Match.** `cv2.BFMatcher` is a **brute-force** matcher: it compares every descriptor in image 1 with every descriptor in image 2.
   - `cv2.NORM_HAMMING` measures the **distance** between two descriptors by counting how many of their 256 bits differ. This is the right distance for ORB's bit descriptors. Distance 0 means identical.
   - `crossCheck=True` keeps a match only if the two features **choose each other**: A's best match is B, **and** B's best match is A. This removes many wrong matches.
4. **Sort and draw.** Sorting by `distance` puts the most similar pairs first; `drawMatches` draws the best 30 side by side.

Here 303 cross-checked matches were found. The best pair differs in only 1 bit out of 256, and even the 30th best differs in only 7.

**ORB** detects and describes features; **BFMatcher** compares descriptors; **drawMatches** shows the matching features.

## [explanation] When does matching become difficult?

We kept image A fixed, changed image B in seven ways, and counted the **good matches**: cross-checked matches with a distance below 40 bits. In normal conditions there are **258**.

| Image B changed by… | Good matches |
|---|---|
| nothing (normal) | 258 |
| uniformly darker (half the brightness) | 252 |
| different lighting (dark on one side, bright on the other) | 91 |
| a different camera angle (stronger tilt) | 135 |
| motion blur (sideways) | 54 |
| occlusion (the left half hidden) | 106 |
| poor image quality (pixelated and noisy) | 116 |
| a large scale change (B shrunk to a quarter) | 2 |

These numbers come from our two drawn views and our OpenCV version; with other images or versions they will differ, but the pattern is typical.

## [diagram] Image B, changed seven ways

![A grid of eight versions of view B, each labelled with its number of good matches: normal 258, darker 252, uneven lighting 91, different angle 135, motion blur 54, occlusion 106, poor quality 116 and a quarter size 2](images/cv-match-difficulty.png)

## [explanation] What the experiment shows

- **Uniform darkness barely matters** (252 of 258). ORB compares pixels **with each other**, not with fixed values, so making everything darker keeps the comparisons the same. **Uneven** lighting changes the comparisons, and hurts.
- **Motion blur and big scale changes are the worst.** Blur wipes out the fine detail the descriptors are built from; a quarter-size image has too few pixels to show the same detail. Both happen on a moving vehicle.
- **A good match is not always a correct match.** A distance below 40 means "looks alike"; it can still join two different windows.

**Lecture 2 link:** this is one reason why image enhancement and good image quality matter. Denoising, sharpening and good exposure give the matcher more to work with.

## [code] Try it: how much does motion blur hurt?

This program blurs image B sideways with a filter2D kernel (an average along one row, like the camera sliding during the photo) and counts good matches with and without it. Afterwards, change the kernel to `(1, 5)` or `(1, 30)` and run again: a longer blur loses more matches.

```python program
import cv2
import numpy as np

img1 = cv2.imread("view-a.png", 0)
img2 = cv2.imread("view-b.png", 0)
blurred = cv2.filter2D(img2, -1, np.ones((1, 15)) / 15)

orb = cv2.ORB_create()
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
kp1, des1 = orb.detectAndCompute(img1, None)

for name, img in [("normal", img2), ("motion blur", blurred)]:
    kp2, des2 = orb.detectAndCompute(img, None)
    matches = bf.match(des1, des2)
    good = [m for m in matches if m.distance < 40]
    print(name, len(good))
```

```output
normal 258
motion blur 54
```

```notes
6 | np.ones((1, 15)) / 15 | average 15 pixels in a row | circle sky
12 | for name, img in | the same test, twice | square yel
15 | m.distance < 40 | keep good matches only | diamond green
```

## [explanation] Mini lab task: match two images

1. **Choose or capture two images of the same object**: a book, a keyboard, a bottle, a building, a road sign or a laptop. Move a little between the two photos. Save them as `image1.jpg` and `image2.jpg` next to your script.
2. **Detect ORB features** in each image.
3. **Match the descriptors and draw the best 30.** Reuse the matching program above: change only the file names.

**Check your result:** do the lines join the same real points? Objects with print and texture (a book cover, a labelled bottle) give many matches; plain objects (a white mug) give very few. Then try a deliberately hard pair: different lighting, a strong angle, or one photo much closer than the other. Compare the numbers with `print(len(matches))`.

## [note] Check yourself

::: check Two ORB descriptors differ in 3 of their 256 bits. What is their Hamming distance, and is that a good match?
???
The distance is **3**. That is very small (out of 256), so the two patches look almost identical: a good match.
:::

::: check What does `crossCheck=True` add?
???
It keeps a match only if the two features choose **each other**: the best match for A's feature is B's feature, and the best match for B's feature is A's. One-sided matches, which are often wrong, are dropped.
:::

## [common_mistakes] Common mistakes

- **`NORM_L2` with ORB.** ORB descriptors are bits; use `cv2.NORM_HAMMING`.
- **Drawing all the matches.** Hundreds of lines hide everything. Sort by distance and draw the best few.
- **Assuming every match is correct.** Look at the lines: one crossing to a different object is a wrong match.
- **Images of different objects.** Matching always returns *something*; few matches with large distances mean "not the same thing".
- **No descriptors.** On a blank or very dark image `detectAndCompute` can return `None` for the descriptors, and `bf.match` then fails. Check before matching.

## [key_takeaways] Key takeaways

- Matching finds which feature in image A is the same real point as one in image B.
- `cv2.BFMatcher` with `cv2.NORM_HAMMING` and `crossCheck=True` compares ORB descriptors by counting differing bits.
- Sort matches by `distance` (smaller is better) and draw the best with `cv2.drawMatches`.
- Uneven lighting, a different angle, blur, occlusion, poor quality and scale changes all reduce good matches.
