---
slug: features-and-edges
title: Features, edges and the Canny detector
topic: edge-detection
lecture: 3
difficulty: medium
description: Find out what makes a part of an image a good feature, tell flat regions, edges and corners apart, and find edges with cv2.Canny. Then measure how the two thresholds change the result.
objectives:
  - Define a feature and explain why corners are easier to find again than edges
  - Name applications that depend on features
  - Detect edges with cv2.Canny on a grayscale image
  - Predict and measure the effect of Canny's low and high thresholds
prerequisites:
  - An enhancement pipeline and the "fix this image" challenge
related:
  - enhancement-pipeline-and-challenge
  - finding-corners
updated: 2026-10-15
---

## [explanation] From image enhancement to feature detection

Last lab ended with an improved image: read, grayscale, resize, denoise, enhance. But **how does the computer know which parts of the image are important?**

Today's goal: find **useful visual features automatically**. This lecture has two parts. Part 1 is feature detection and matching with OpenCV. Part 2 starts the semester project, a camera-equipped vehicle.

## [explanation] What is a feature?

**A feature is a distinctive part of an image that can be detected again**, for example in a second photo of the same place.

Imagine a small window lying on the image, and slide it a few pixels in each direction:

| Region | When the window moves… | Can you find it again? |
|---|---|---|
| **Flat region** (the sky) | nothing changes, in any direction | **hard**: it looks the same everywhere |
| **Edge** (a road line) | it changes **across** the line, not **along** it | **ambiguous**: you know the line, not where on it |
| **Corner** (a window corner) | it changes in **every** direction | **easy**: the position is unique |

**Good features are distinctive.** A detector marks the distinctive locations it finds; each one is called a **keypoint**.

## [diagram] Flat region, edge and corner

![Three enlarged patches cut from the street image, with every pixel visible. Flat region: plain blue sky. Edge: the white edge line of the road crossing the patch diagonally. Corner: the top-left corner of a dark window in a light building wall](images/cv-flat-edge-corner.png)

## [explanation] Why do we need features?

Features are the bridge between raw pixels and understanding: **image → features → understanding**. Almost every advanced computer vision task is built on them:

| Application | What features do there |
|---|---|
| **Image matching** | decide whether two images show the same object |
| **Object recognition** | recognise an object from its typical features |
| **Tracking** | follow the same features from frame to frame |
| **Image stitching** | join photos into a panorama where their features overlap |
| **Visual SLAM** | build a map while working out where the camera is |
| **Robot navigation** | find a path using what the camera sees |
| **Autonomous vehicles** | all of the above, on a moving car: our semester project |

## [explanation] Edges vs corners

An **edge** is a **strong change in image intensity**: building borders, road lines, the outline of an object.

A **corner** is where **two or more edges meet**: window corners, the corners of a road sign, building corners.

**Corners are often easier to recognise again**, for the reason in the table above: they change in every direction.

## [diagram] Edges and corners on the street

![Two versions of the street scene side by side. Left: the edges found by Canny, light blue lines on dark navy, outlining the buildings, windows, road lines, car, sign, house and tree. Right: the street with 100 red dots at the strongest corners, mostly on the window corners of two of the buildings, with some on the stop sign, the car, the tree, the snowy peaks and stones on the road, and almost none along the long straight road lines](images/cv-edges-vs-corners.png)

Why are there almost no corners along the long, straight road lines? Because a straight line only changes in **one** direction. Corners appear where two edges meet: the windows, the sign, the car, the snowy peaks.

## [code] Finding edges with OpenCV

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 100, 200)
cv2.imshow("Original", img)
cv2.imshow("Edges", edges)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```notes
4 | cvtColor | edges need brightness only | circle sky
5 | Canny | find strong changes | square yel
5 | 100, 200 | low and high thresholds | diamond green
```

## [diagram] The Edges window

![Two windows. Original shows the colour street. Edges is black with thin white lines wherever the brightness changes strongly: building outlines and windows, the road's edge lines and centre dashes, the car, the stop sign, the house and the tree, plus scattered short marks in the grass and on the road](images/cv-canny.png)

**In one sentence: Canny searches for strong changes in pixel intensity.** Its result is a black image (0) with white pixels (255) on the edges.

**Project link:** lane lines, road borders and car outlines are all strong intensity changes, so they show up clearly. That is why edges are the first features our vehicle will use.

## [explanation] The two thresholds

`cv2.Canny(gray, low, high)` measures how strongly the brightness changes at every pixel, then uses the two numbers:

| Change at a pixel | Result |
|---|---|
| stronger than `high` | an edge, for sure |
| between `low` and `high` | an edge **only if** it connects to a sure edge |
| weaker than `low` | not an edge |

So **lower thresholds → more edges**, including weak ones such as texture. **Higher thresholds → fewer, stronger edges.** A common rule of thumb is to make `high` about **two to three times** `low`.

## [code] Experiment: change the thresholds

Start with 100, 200, then change both numbers and run again. This program tries three pairs and measures the share of pixels that Canny marked as edges:

```python program
import cv2
import numpy as np

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
for low, high in [(50, 100), (100, 200), (150, 250)]:
    edges = cv2.Canny(gray, low, high)
    percent = np.count_nonzero(edges) / edges.size * 100
    print(low, high, round(percent, 1), "% edges")
```

```output
50 100 8.9 % edges
100 200 5.4 % edges
150 250 3.8 % edges
```

```notes
6 | for low, high in | three pairs to try | circle sky
8 | count_nonzero | white pixels = edges | square yel
8 | edges.size | all pixels | diamond green
```

## [diagram] Three pairs of thresholds

![Three close-ups of the bottom of the edge image: the road, the person, the car and the stop sign. 50, 100: 8.9 percent edges, with the grass and road full of short marks from the texture. 100, 200: 5.4 percent, with fewer texture marks. 150, 250: 3.8 percent, mostly clean outlines of the buildings, road lines and car](images/cv-canny-thresholds.png)

With **50, 100**, the grass blades and the road's small stones fill the image with short marks. With **150, 250**, mostly the strong outlines are left. **Which values work best for your image?** Keep the edges you need and lose the noise. There is no single correct answer: the best values depend on the image and the lighting, which is why we will tune them again on live video in the project.

## [note] Check yourself

::: check Which is easier to find again in a second photo: a point in the middle of a long straight road line, or the corner of a window? Why?
???
**The window corner.** Moving along a straight line looks the same, so the position on the line is ambiguous. A corner changes in every direction, so its position is unique.
:::

::: check You lower Canny's thresholds from (100, 200) to (50, 100). Will the percentage of edge pixels go up or down?
???
**Up.** Weaker changes now count as edges, so more pixels are marked. On `street.png` it went from 5.4% to 8.9%.
:::

## [common_mistakes] Common mistakes

- **Running Canny on a colour image.** Convert to grayscale first; edges depend on brightness.
- **Expecting object outlines only.** Canny marks every strong change, including texture, shadows and noise. Blur first or raise the thresholds.
- **Changing only one threshold.** Change both together, keeping `high` about 2 to 3 times `low`. (If you swap them, OpenCV quietly uses the smaller one as `low`.)
- **Thinking an edge image is a list of lines.** It is still an image: a grid of 0s and 255s with the same size as the input.

## [key_takeaways] Key takeaways

- A feature is a distinctive part of an image that can be detected again.
- Flat regions are hard to find again, edges are ambiguous, corners are easy.
- `cv2.Canny(gray, low, high)` marks strong intensity changes as white pixels.
- Lower thresholds give more edges; higher thresholds give fewer, stronger ones.
