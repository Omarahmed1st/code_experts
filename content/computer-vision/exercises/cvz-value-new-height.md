---
slug: cvz-value-new-height
type: trace
ask: value
title: The height that keeps the ratio
lesson: resizing-images
difficulty: easy
updated: 2026-10-16
---

## Question

The program picks a new width for `street.png` and works out the height that keeps the aspect ratio. What is the value of `new_h` **when the last line runs**? Type the number only.

## Code

```python
h, w = 540, 960
new_w = 480
new_h = int(h * new_w / w)
print("Size ready")
```

```python verify
h, w = 540, 960
new_w = 480
new_h = int(h * new_w / w)
print(new_h)
```

## Answer

```output
270
```

## Hints

- new height = old height × new width ÷ old width.
- 480 is what fraction of 960?

## Explanation

540 × 480 ÷ 960 = 259,200 ÷ 960 = 270.0, and `int()` makes it **270**. Since 480 is half of 960, the height is half of 540 too: the picture shrinks by the same amount in both directions, so nothing is stretched.
