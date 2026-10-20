---
slug: cvf-centre-six
type: mcq
title: A kernel with 6 in the centre
lesson: sharpening-images
difficulty: medium
updated: 2026-10-16
---

## Question

A student changes the centre of the sharpening kernel from 5 to 6. What happens when this kernel is applied with `cv2.filter2D`?

## Code

```python
kernel = np.array([[0, -1, 0], [-1, 6, -1], [0, -1, 0]])
```

## Options

- [x] A flat grey area of 100 becomes 200: the whole image gets brighter, not only the edges.
  Right: 6 × 100 − 4 × 100 = 200. The numbers now add up to 2, not 1.
- [ ] Nothing changes in flat areas; the edges just get a little sharper.
  That is only true when the numbers add up to 1, as with a centre of 5.
- [ ] A flat area of 100 becomes 600.
  The four neighbours are still subtracted: 600 − 400 = 200.
- [ ] `filter2D` refuses the kernel, because its numbers must add up to 1.
  `filter2D` accepts any numbers. Checking the sum is your job.

## Explanation

In a flat area every neighbour equals the centre, so the new value is the centre times the **sum of the kernel's numbers**. With 5 and four −1s the sum is 1, so flat areas keep their value. With 6 the sum is 2, so every flat area doubles in brightness (and anything above 127 ends up at 255).
