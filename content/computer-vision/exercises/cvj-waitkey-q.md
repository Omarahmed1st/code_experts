---
slug: cvj-waitkey-q
type: mcq
title: The q key test
lesson: live-camera-pipeline
difficulty: medium
updated: 2026-10-16
---

## Question

What does this line do inside the camera loop?

## Code

```python
if cv2.waitKey(1) & 0xFF == ord('q'):
    break
```

## Options

- [x] It waits 1 millisecond for a key, lets the windows refresh, and leaves the loop if the key was q.
  Right: `ord('q')` is the code of the letter q, and `& 0xFF` keeps the last byte of the key code.
- [ ] It waits until the user presses q, then shows the next frame.
  `waitKey(1)` waits only 1 ms. With `waitKey(0)` the video would stop on every frame.
- [ ] It stops the program after 1 frame.
  The `break` only happens when q was pressed.
- [ ] It only checks for q; the windows refresh by themselves.
  OpenCV draws its windows only while `waitKey` runs. Without it they stay grey.

## Explanation

`cv2.waitKey(1)` does two jobs in the loop: it gives OpenCV a moment to **draw the windows**, and it reports which key, if any, was pressed. Comparing it with `ord('q')` makes **q** the exit key. After the loop, `cap.release()` frees the camera and `cv2.destroyAllWindows()` closes the windows.
