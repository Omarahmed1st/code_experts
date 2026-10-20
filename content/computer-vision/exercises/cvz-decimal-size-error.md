---
slug: cvz-decimal-size-error
type: mcq
title: Resize stops with an error
lesson: resizing-images
difficulty: medium
updated: 2026-10-16
---

## Question

`img` is loaded correctly and is 540 pixels tall. Why does the last line stop with an error that says `Can't parse 'dsize'`?

## Code

```python
h = img.shape[0]
new_h = h * 0.5
small = cv2.resize(img, (480, new_h))
```

## Options

- [x] `new_h` is `270.0`, a decimal, and a size must be whole numbers. Use `int(h * 0.5)`.
  Right: `*` with 0.5 always gives a decimal, even when the result is a whole amount.
- [ ] The size should be (height, width), so it must be `(new_h, 480)`.
  `resize` really does take (width, height). The problem is the type of `new_h`.
- [ ] `resize` can't make an image smaller; it can only enlarge.
  `resize` can do both.
- [ ] 480 and 270 don't keep the aspect ratio, so OpenCV refuses.
  OpenCV accepts any size, and stretches the picture if the ratio changes. Here the ratio happens to be kept.

## Explanation

`dsize` is the name of the size argument. OpenCV needs it as two **whole numbers**. Any calculation with `*` and a decimal, or with `/`, gives a float, so wrap calculated sizes in `int()`:

```python
new_h = int(h * 0.5)
```
