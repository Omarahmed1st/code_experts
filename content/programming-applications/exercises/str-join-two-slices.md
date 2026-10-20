---
slug: str-join-two-slices
type: mcq
title: Joining two slices of "Luxor"
lesson: strings-indexing-and-slicing
difficulty: medium
updated: 2026-10-10
---

## Question

What does this program print?

## Code

```python
word = "Luxor"
print(word[2:] + word[:2])
```

## Options

- [x] `xorLu`
  Right: `word[2:]` is `xor` (index 2 to the end) and `word[:2]` is `Lu` (indexes 0 and 1). `+` joins them.
- [ ] `xorLux`
  The stop index is **not** included: `word[:2]` takes indexes 0 and 1 only, so it is `Lu`, not `Lux`.
- [ ] `uxorL`
  This counts from 1. In Python the first character is index 0, so index 2 is `x`, not `u`.
- [ ] `Luxor`
  The two pieces are joined in the order they are written: first `word[2:]`, then `word[:2]`.

## Answer

```output
xorLu
```

## Hints

- Write the indexes under the letters: L is 0, u is 1, x is 2, o is 3, r is 4.
- No start means "from index 0". No stop means "to the end". The stop index itself is never included.

## Explanation

| L | u | x | o | r |
|---|---|---|---|---|
| 0 | 1 | 2 | 3 | 4 |

- `word[2:]` starts at index 2 and, with no stop, runs to the end: `xor`.
- `word[:2]` starts at index 0 and stops **before** index 2: `Lu`.

Using `+` on two Strings joins them in the order written, so the program prints `xorLu`. Notice that the two slices together use every character exactly once: `word[:2]` and `word[2:]` split the word at index 2 with nothing lost and nothing repeated.
