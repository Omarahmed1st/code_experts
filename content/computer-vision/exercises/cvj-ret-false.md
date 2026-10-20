---
slug: cvj-ret-false
type: mcq
title: When is ret False?
lesson: live-camera-pipeline
difficulty: easy
updated: 2026-10-16
---

## Question

In `ret, frame = cap.read()`, when is `ret` **False**?

## Options

- [x] When no frame could be read: for example, the camera was unplugged or the video file ended.
  Right: `frame` is then `None`, which is why the loop checks `if not ret: break`.
- [ ] When the frame is completely black.
  A black frame is still a frame. `ret` is `True` and `frame` holds zeros.
- [ ] When the user presses q.
  The q key is checked by `cv2.waitKey(1)`, not by `cap.read()`.
- [ ] On every second frame, to save time.
  `cap.read()` gives a new frame on every call while frames are available.

## Explanation

`cap.read()` gives back two values: `ret` says whether reading worked, and `frame` is the image. When nothing could be read, `ret` is `False` and `frame` is `None`. Without `if not ret: break`, the next line, `cv2.resize(frame, …)`, would fail on `None`.
