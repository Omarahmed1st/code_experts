---
slug: what-is-computer-vision
title: What is computer vision?
topic: introduction-to-computer-vision
lecture: 1
difficulty: easy
description: Computer vision lets a computer get useful information out of images and videos. Compare it with human vision, and see what a computer really receives from a camera, a grid of numbers.
objectives:
  - Say in one sentence what computer vision is and what it is for
  - Compare human vision with computer vision step by step
  - Explain that a computer first sees an image as a grid of pixel values
prerequisites:
  - "Python basics: variables, print() and Lists (Programming Applications course)"
related:
  - computer-vision-tasks-and-applications
  - reading-and-showing-images
updated: 2026-10-15
---

## [explanation] How computers understand images and videos

**Computer vision** is the part of computer science that lets computers **understand visual information**. It works with **images** (one picture) and **videos** (many pictures in a row).

The goal is always the same: **extract useful information from visual data**. A camera only records light. A computer vision system turns that recording into something a program can use:

**Image → Computer vision system → Understanding or a decision**

For example, a car's camera records the road ahead. The computer vision system finds the lane lines and the car in front. The understanding ("the lane bends left, a car is 20 metres ahead") lets the car decide what to do.

## [explanation] Human vision vs computer vision

Both follow three steps, but each step is done by something different:

| Step | Human vision | Computer vision |
|---|---|---|
| 1. Capture | the **eyes** capture the scene | a **camera** captures an image |
| 2. Interpret | the **brain** recognises objects | the **computer processes pixels** |
| 3. Act | the **person** makes a decision | an **algorithm** makes a prediction |

Step 2 is the hard part. You recognise a car instantly, from any angle, in sunshine or at night, even when half of it is hidden. A computer has to be taught every one of those cases, and that is what this course is about.

## [explanation] What does a computer see?

When you look at a photo of a street, you see buildings, a road and a car. A computer sees **no objects at first: just a grid of numbers**.

The image is cut into tiny squares called **pixels**. Each pixel stores numbers that say how bright it is (and, in a colour image, which colour). Everything a computer vision program does, from making a photo brighter to recognising a person, is done by working on those numbers.

## [diagram] The street image, as the computer sees it

![Left: a drawn street scene with buildings, a road, a red car and a stop sign, with a small square marked on the corner of a building's window. Middle: that square enlarged so each pixel is a large block, light grey wall pixels and dark window pixels. Right: the same 6 by 6 pixels as numbers, 181 for the wall and 65 for the window](images/cv-computer-sees.png)

This is `street.png`, a drawn street scene used throughout this course (download it with the link under the picture). The enlarged square is the top-left corner of one window. To the computer, the light wall is the number **181** and the dark window is **65**. The corner you see is only the place where the numbers change.

## [code] A first look at the numbers

You will learn every line of this program in the next lecture. For now, just look at the output: these are the 9 pixels at the corner of that window.

```python program
import cv2

img = cv2.imread("street.png", cv2.IMREAD_GRAYSCALE)
print(img[163:166, 31:34])
```

```output
[[181 181 181]
 [181  65  65]
 [181  65  65]]
```

```notes
3 | cv2.imread | load the image | circle sky
3 | IMREAD_GRAYSCALE | one number per pixel | square yel
4 | 163:166, 31:34 | 3 rows, 3 columns | diamond green
```

## [explanation] From numbers to understanding

Look at the output again. Nothing in it says "window" or "building". A program has to find the **pattern**: a block of small numbers (dark) inside larger numbers (light), with straight borders and sharp corners. Then it has to decide that this pattern, repeated in a grid, is probably the windows of a building.

That is why computer vision is usually done in steps: first clean up the numbers, then find simple patterns such as edges and corners, then combine them into objects. The next lesson shows those steps.

## [note] Check yourself

::: check A grayscale image is 640 pixels wide and 480 pixels tall. How many numbers does the computer store for it?
???
**307,200** numbers: one per pixel, and 640 × 480 = 307,200. A colour image of the same size stores three numbers per pixel, so 921,600.
:::

::: check In the human-vision column, the brain recognises objects. What does that step become in computer vision?
???
**The computer processes pixels.** It has no idea of "objects" at first; it calculates with pixel values until it finds patterns it was built to recognise.
:::

## [common_mistakes] Common misunderstandings

- **"The computer sees the picture."** It receives numbers. Seeing, in the human sense, is exactly what computer vision programs try to build.
- **"A camera is computer vision."** A camera only captures. Computer vision is the processing that turns the capture into information.
- **"One program recognises everything."** Each system is built for a task (find lanes, read a sign, count people) and is only as good as the examples and methods behind it.

## [key_takeaways] Key takeaways

- Computer vision lets computers **extract useful information** from images and videos.
- Human vision: eyes, brain, decision. Computer vision: camera, pixel processing, prediction.
- To a computer an image is a **grid of pixel values**; objects appear only after processing.
