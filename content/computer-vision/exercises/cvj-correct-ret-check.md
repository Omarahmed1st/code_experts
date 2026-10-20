---
slug: cvj-correct-ret-check
type: correct_code
title: Fix the frame loop
lesson: live-camera-pipeline
difficulty: medium
updated: 2026-10-16
---

## Question

This program copies the camera loop without a camera: it reads a "video" as names on one line, and each pass of the loop takes the next one, like `ret, frame = cap.read()`. It should process every frame and stop when the video ends. Instead it processes nothing. Fix the one wrong line.

## Code

```python
video = input().split()
next_index = 0
processed = 0
while True:
    if next_index < len(video):
        ret, frame = True, video[next_index]
        next_index = next_index + 1
    else:
        ret, frame = False, None
    if ret:
        break
    print("edges of", frame)
    processed = processed + 1
print("frames processed:", processed)
```

## Expected behavior

The program prints `edges of` and the frame's name for every frame, then how many frames were processed. For `f1 f2 f3` it prints:

```
edges of f1
edges of f2
edges of f3
frames processed: 3
```

## Tests

### three frames

```input
f1 f2 f3
```

```output
edges of f1
edges of f2
edges of f3
frames processed: 3
```

### one frame

```input
street
```

```output
edges of street
frames processed: 1
```

### five frames

```input
a b c d e
```

```output
edges of a
edges of b
edges of c
edges of d
edges of e
frames processed: 5
```

## Solution

```python
video = input().split()
next_index = 0
processed = 0
while True:
    if next_index < len(video):
        ret, frame = True, video[next_index]
        next_index = next_index + 1
    else:
        ret, frame = False, None
    if not ret:
        break
    print("edges of", frame)
    processed = processed + 1
print("frames processed:", processed)
```

## Also accepted

```python
video = input().split()
next_index = 0
processed = 0
while True:
    if next_index < len(video):
        ret, frame = True, video[next_index]
        next_index = next_index + 1
    else:
        ret, frame = False, None
    if ret == False:
        break
    print("edges of", frame)
    processed = processed + 1
print("frames processed:", processed)
```

## Hints

- On the very first pass, a frame was read, so `ret` is `True`. What does the `if` do then?
- The loop should stop when reading **failed**.

## Explanation

The loop must leave when there is **no** frame: `if not ret: break`. The program had `if ret: break`, so it left as soon as the first frame was read successfully, and processed nothing. This is the same check as in the project pipeline, where `ret` is `False` when the camera is unplugged or the video file ends.
