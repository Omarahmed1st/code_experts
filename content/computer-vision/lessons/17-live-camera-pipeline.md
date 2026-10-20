---
slug: live-camera-pipeline
title: "Project part 1: a live camera pipeline"
topic: jetson-projects
lecture: 3
difficulty: medium
description: Build the project's first milestone. Open a camera with cv2.VideoCapture, read frames in a loop, and resize, convert, blur and find edges in every frame, with three live windows and q to quit. Then tune the pipeline and look ahead to lane detection.
objectives:
  - Open a camera with cv2.VideoCapture and check it with isOpened()
  - Read frames in a while loop and stop when ret is False
  - Apply resize, grayscale, Gaussian blur and Canny to every live frame
  - Leave the loop with the q key and release the camera
  - Tune the blur kernel and Canny thresholds and explain the trade-off
prerequisites:
  - "The semester project: a Jetson vision vehicle"
  - Features, edges and the Canny detector
related:
  - jetson-vision-vehicle
  - features-and-edges
updated: 2026-10-15
---

## [explanation] Project part 1: camera and vision pipeline

Today we start the actual project. **Goal: make the computer receive a live camera image and process every frame using OpenCV.** This is the first working vision pipeline for the vehicle:

**Camera → live video → frame → resize → grayscale → Gaussian blur → Canny edge detection → display the result**

Everything in it is something you already know from lecture 2 and the first part of this lecture. The only new parts are **opening the camera** and **the loop**.

You need a webcam: a laptop's built-in camera, a USB camera, or a phone used as a webcam. Without one, you can use a short video file instead (see step 1).

**About the outputs on these pages:** they were recorded with a test clip of the street instead of a real camera, so they show 960 × 540 frames of `street.png`. Your camera will give its own size and, of course, its own picture.

## [code] Step 1: open the camera

```python program
import cv2

cap = cv2.VideoCapture(0)
print(cap.isOpened())
cap.release()
```

```output
True
```

```notes
3 | VideoCapture(0) | the first camera | circle sky
4 | isOpened() | True = camera ready | square yel
5 | release | free the camera | diamond green
```

## [explanation] Which camera?

`cv2.VideoCapture(0)` opens the **first available camera** and gives back an object, `cap`, that we read frames from. The number is the camera index:

| Argument | Opens |
|---|---|
| `0` | the first camera (usually the built-in webcam) |
| `1` | a second camera (for example a USB camera) |
| `"road.mp4"` | a video file instead of a camera |

**Always check `cap.isOpened()`.** If it prints `False`, the index is wrong, another program is using the camera, or the operating system blocked camera access.

On the Jetson later, a USB camera usually works with the same line. A ribbon-cable (CSI) camera normally needs a longer text instead of `0` (a GStreamer pipeline); we will cover it when we move to the vehicle.

## [code] Step 2: read video frames

`cap.read()` returns two values every time you call it:

```python program
import cv2

cap = cv2.VideoCapture(0)
ret, frame = cap.read()
print(ret)
print(frame.shape)
cap.release()
```

```output
True
(540, 960, 3)
```

```notes
4 | ret, frame | two values back | circle sky
5 | ret | True = a frame was captured | square yel
6 | frame.shape | an image, like img | diamond green
```

## [explanation] ret and frame

| Value | Meaning |
|---|---|
| `ret` | `True` if a frame was captured, `False` if not (camera unplugged, video file ended) |
| `frame` | the current image from the camera: a NumPy array, `(height, width, 3)`, in BGR |

The shape above is the test clip's, 960 × 540. Many webcams give `(480, 640, 3)` or `(720, 1280, 3)`; print it once on your own computer to see yours.

In the project, `cap.read()` sits inside a loop, so each pass gives a **new frame**:

```python
while True:
    ret, frame = cap.read()
```

## [explanation] An image and a frame work the same way

Lecture 2, one image, processed once:

```python
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
```

The project, every live frame, processed again on every pass of the loop:

```python
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
```

Spot the difference: **only the variable name**. `img` came from `imread`, `frame` comes from `cap.read()`, and both are the same kind of NumPy array. So every technique you know (grayscale, resize, brightness and contrast, blur, sharpening, equalization, Canny, corners, ORB) runs on live video without any change.

## [code] Build the live processing pipeline

Type it, don't paste it, so you read every line. Every team needs this working.

```python program
import cv2

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    resized = cv2.resize(frame, (640, 480))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    cv2.imshow("Original", resized)
    cv2.imshow("Grayscale", gray)
    cv2.imshow("Edges", edges)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

```notes
3 | VideoCapture(0) | 1. open the camera | circle sky
6 | cap.read() | 2. read a frame | square yel
7 | if not ret | stop if there is none | tri coral
9 | resize | 3. 640 × 480 | diamond green
10 | cvtColor | 4. grayscale | circle green
11 | GaussianBlur | 5. blur away noise | square sky
12 | Canny | 6. find the edges | diamond yel
16 | ord('q') | 8. press q to leave | tri sky
```

## [explanation] The program, step by step

1. **Open camera 0.**
2. Inside the loop, **read a frame**; if `ret` is `False` (camera unplugged, video ended), `break` out of the loop.
3. **Resize** to 640 × 480, so every camera gives the same size.
4. **Grayscale**: edges depend on brightness only.
5. **Gaussian blur** with a 5 × 5 kernel, to remove small noise.
6. **Canny** with thresholds 50 and 150, on the blurred image.
7. **Show three windows**: Original, Grayscale and Edges.
8. **`cv2.waitKey(1)`** waits 1 millisecond for a key and lets the windows refresh. `& 0xFF` keeps the last byte of the key code, and `ord('q')` is the code of the letter q, so pressing **q** leaves the loop.
9. **Release** the camera so other programs can use it, and **close** the windows.

## [diagram] What each stage does to one frame

![Five panels in a row showing one frame going through the pipeline. Frame: the colour street, 960 by 540. Resize: 640 by 480. Grayscale: one channel. Gaussian blur: slightly softer, the road texture smoothed. Canny edges: white outlines of the buildings, road lines, car, sign and house on black, about 3.4 percent of the pixels](images/cv-live-stages.png)

| Stage | Why |
|---|---|
| **Frame** | one image from the camera (960 × 540 here) |
| **Resize** | faster, consistent processing: the same size whatever camera is plugged in |
| **Grayscale** | simplifies the image: 1 channel instead of 3 |
| **Gaussian blur** | reduces small noise, such as the road's texture |
| **Canny → edges** | finds strong boundaries and edges |

Every frame goes through the same stages, about 30 times a second on a 30 FPS camera. On this frame about **3.4%** of the pixels are edge pixels. Your own camera image will look different.

## [diagram] The three live windows

![Three windows side by side, as the program shows them: Original (the colour frame at 640 by 480), Grayscale and Edges](images/cv-live-windows.png)

## [explanation] Why are edges useful for the vehicle?

**The computer doesn't need every pixel equally.** A 640 × 480 frame has 307,200 pixels, but only about 3% of them are edge pixels, and **important structures often create strong edges**: lane lines, road borders, other vehicles, signs.

## [diagram] What each edge belongs to

![The Canny edges of the frame, recoloured by what each edge belongs to: light blue for the lane lines, orange for the car, green where the road meets the grass, red for the stop sign, and grey for everything else, mostly the buildings](images/cv-edges-meaning.png)

The colours are only for this picture: Canny itself outputs plain white edges. They come from the drawing's own map of what each pixel shows. **Next project step: keep the edges that belong to the road and the lane.**

## [explanation] Today's project task: your first milestone

**Every team builds live camera + live image processing + live edge detection.** Required steps:

1. Open the camera.
2. Read frames.
3. Resize to 640 × 480.
4. Convert to grayscale.
5. Apply a Gaussian blur.
6. Apply Canny edge detection.
7. Display Original, Grayscale and Edges.
8. Press Q to stop the program.

**Expected result: three live windows** that update when someone waves a hand in front of the camera, and close cleanly with q. If your webcam doesn't work, pass a video file name to `VideoCapture` so you can still finish the pipeline.

## [code] Experiment: improve your vision pipeline

Teams that have the pipeline running can tune it. This program measures the share of edge pixels on one test frame (`street.png`) for different settings:

```python program
import cv2
import numpy as np

frame = cv2.imread("street.png")
resized = cv2.resize(frame, (640, 480))
gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

def edge_percent(blur_size, low, high):
    blur = cv2.GaussianBlur(gray, (blur_size, blur_size), 0)
    edges = cv2.Canny(blur, low, high)
    return round(np.count_nonzero(edges) / edges.size * 100, 1)

print("Canny thresholds, blur (5, 5):")
for low, high in [(50, 100), (50, 150), (100, 200)]:
    print(" ", low, high, edge_percent(5, low, high), "%")
print("Blur kernel, Canny 50, 150:")
for k in [3, 5, 9]:
    print(" ", (k, k), edge_percent(k, 50, 150), "%")
```

```output
Canny thresholds, blur (5, 5):
  50 100 4.0 %
  50 150 3.4 %
  100 200 3.0 %
Blur kernel, Canny 50, 150:
  (3, 3) 4.3 %
  (5, 5) 3.4 %
  (9, 9) 2.8 %
```

```notes
8 | def edge_percent | one setting, one number | circle sky
14 | (50, 150) | the pipeline's setting | square yel
17 | [3, 5, 9] | odd kernel sizes only | diamond green
```

## [diagram] Six settings side by side

![Two rows of three edge images. Top row, blur fixed at 5 by 5: Canny 50, 100 at 4.0 percent with texture speckles on the road and grass; 50, 150 at 3.4 percent; 100, 200 at 3.0 percent, cleaner but with parts of the car's outline missing. Bottom row, Canny fixed at 50, 150: blur 3 by 3 at 4.3 percent with texture noise; 5 by 5 at 3.4 percent; 9 by 9 at 2.8 percent, very clean but the small window shapes and the STOP letters fade](images/cv-live-experiments.png)

**Questions to answer with your team:**

- Which settings detect useful edges?
- Which settings produce too much noise?
- What happens when the camera moves? (Move it quickly: motion blur weakens edges.)
- What happens when the lighting changes? (Switch a light off and on: edges appear and disappear.)

These are the same problems we measured for matching in Part 1. There is no perfect setting, only a good balance for your camera and scene. Remember that kernel sizes must be odd.

## [explanation] Project milestone 1 checklist

Tick each one when it works:

- Camera connected
- Frame captured
- Frame resized
- Grayscale working
- Blur working
- Canny working
- Live output working
- Exit with q working

**If this works, the project has officially started.** Save the file as `milestone1.py` and keep it: every later milestone builds on top of it.

## [explanation] Next project step: which edges are the road?

Our edge image contains everything: buildings, the sign, the car, the road. To drive, the vehicle first needs the lane.

- **Region of interest**: the road in front of the vehicle always appears in roughly the same part of the frame, a trapezoid at the bottom, so edges outside it can be ignored.
- **Lane detection**: find the lane lines among the edges that remain.

That is the next milestone. Think about it before next time: which edges **inside** the trapezoid would still confuse us?

## [diagram] A region of interest

![The edge image of the frame with a shaded trapezoid over the road at the bottom. Inside the trapezoid are the lane lines and the edge of the car; outside it, the buildings, the house and the sign are faded](images/cv-roi-preview.png)

A preview only; we will build it in the next milestone. The car ahead is inside the trapezoid too, and its edges are not lane lines.

## [note] Check yourself

::: check What happens if you remove `cv2.waitKey(1)` from the loop?
???
The windows don't refresh: OpenCV only draws its windows while it waits for a key. They stay grey or frozen, and there is also no way to press q to leave.
:::

::: check Why does the program check `if not ret: break`?
???
When the camera is unplugged or a video file ends, `cap.read()` returns `ret = False` and `frame = None`. Without the check, the next line would fail on `None`. With it, the loop ends cleanly.
:::

## [common_mistakes] Common mistakes

- **Forgetting `waitKey`.** The windows stay grey and nothing updates.
- **Wrong indentation.** Every processing line must be indented inside `while True:`. A line outside the loop runs only once, or never if the loop never ends.
- **Two programs using camera 0.** The second one gets `isOpened()` equal to `False`. Close the first, or `release()` it properly.
- **Forgetting `cap.release()`.** The camera may stay busy until Python closes.
- **Printing in the loop.** `print(frame.shape)` on every frame slows the loop down; print once, then remove it.

## [key_takeaways] Key takeaways

- `cap = cv2.VideoCapture(0)` opens a camera; check `cap.isOpened()`.
- `ret, frame = cap.read()` in a `while True:` loop gives a new frame each pass; `break` when `ret` is `False`.
- A frame is an image: resize, grayscale, blur and Canny work on it unchanged.
- `cv2.waitKey(1) & 0xFF == ord('q')` checks for q; always `release()` the camera at the end.
- Tuning is a balance: smaller blur and lower thresholds give more edges and more noise.
