---
slug: list-remove-then-pop
type: mcq
title: remove() and then pop()
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

What does this program print?

## Code

```python
nums = [5, 3, 5, 8]
nums.remove(5)
x = nums.pop()
print(nums, x)
```

## Options

- [x] `[3, 5] 8`
  Right: `remove(5)` deletes only the **first** 5, giving `[3, 5, 8]`. Then `pop()` takes out the **last** item, 8.
- [ ] `[3] 8`
  `remove()` deletes only the first item that equals 5, not every 5. The second 5 stays in the List.
- [ ] `[5, 8] 3`
  `pop()` with nothing in the brackets removes the **last** item, not the first one.
- [ ] It stops with an `IndexError`.
  `remove(5)` looks for the **value** 5, not index 5. The List contains 5, so there is no error.

## Answer

```output
[3, 5] 8
```

## Hints

- Does `remove()` take an index or a value? How many items does it delete?
- Which end of the List does `pop()` take from?

## Explanation

The List changes twice before it is printed:

| Line | What happens | nums | x |
|---|---|---|---|
| 1 | make the List | `[5, 3, 5, 8]` | |
| 2 | `remove(5)` deletes the first item equal to 5 | `[3, 5, 8]` | |
| 3 | `pop()` removes the last item and gives it back | `[3, 5]` | 8 |

`remove()` works **by value** and stops after the first match, so the second 5 is still there. `pop()` removes the last item **and returns it**, which is why `x` holds 8. `print(nums, x)` prints both with a space between them.
