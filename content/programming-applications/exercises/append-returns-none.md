---
slug: append-returns-none
type: mcq
title: Saving the result of append()
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-09
---

## Question

What does this program print?

## Code

```python
marks = [12, 15]
marks = marks.append(18)
print(marks)
```

## Options

- [ ] `[12, 15, 18]`
  `append()` did add 18, but then the `=` replaced the List with what `append()` returned.
- [x] `None`
  Right: `append()` changes the List and returns nothing, which Python shows as `None`. That `None` is stored in `marks`.
- [ ] `[18]`
  `append()` adds to the end of the existing List; it never makes a new List with one item.
- [ ] It stops with a `TypeError`.
  There is no error on these lines. The problem only shows up later, when you try to use `marks` as a List.

## Answer

```output
None
```

## Hints

- What does `append()` give back after it adds the item?
- Line 2 has an `=`. What ends up in `marks`?

## Explanation

`marks.append(18)` adds 18 to the end of the List, so for a moment the List is `[12, 15, 18]`. But `append()` **returns nothing**: its result is the special value `None`. Line 2 then stores that `None` in `marks`, and the List is lost.

Call `append()` on a line of its own, without `=`:

```python
marks.append(18)
```
