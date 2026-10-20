---
slug: cvj-trace-fps
type: trace
title: Can the loop keep up?
lesson: jetson-vision-vehicle
difficulty: medium
updated: 2026-10-16
---

## Question

Three versions of a team's loop take 20, 40 and 50 milliseconds per frame. The camera delivers 30 frames per second. What exactly does the program print?

## Code

```python
for ms in [20, 40, 50]:
    fps = 1000 / ms
    if fps >= 30:
        print(ms, "ms:", int(fps), "FPS, keeps up")
    else:
        print(ms, "ms:", int(fps), "FPS, too slow")
```

## Answer

```output
20 ms: 50 FPS, keeps up
40 ms: 25 FPS, too slow
50 ms: 20 FPS, too slow
```

## Hints

- A second has 1000 milliseconds. How many 20 ms passes fit in it?
- `int()` drops the `.0` of the division.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | first version | ms = 20 | |
| 2 | 1000 ÷ 20 | ms = 20; fps = 50.0 | |
| 4 | 50 ≥ 30 | | 20 ms: 50 FPS, keeps up\n |
| 1 | second version | ms = 40 | |
| 2 | 1000 ÷ 40 | ms = 40; fps = 25.0 | |
| 6 | 25 < 30 | | 40 ms: 25 FPS, too slow\n |
| 1 | third version | ms = 50 | |
| 2 | 1000 ÷ 50 | ms = 50; fps = 20.0 | |
| 6 | 20 < 30 | | 50 ms: 20 FPS, too slow\n |

## Explanation

**FPS = 1000 ÷ milliseconds per frame.** At 30 FPS, each frame gets about 33 ms. A 20 ms loop handles 50 frames per second, so it keeps up. A 40 ms or 50 ms loop handles only 25 or 20, so frames arrive faster than they are processed and the vehicle reacts late. Shrinking the frames first, as the pipeline does, is one way to make each pass faster.
