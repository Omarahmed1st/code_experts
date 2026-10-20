---
slug: blanks-py-hidden-message
type: correct_code
ask: blanks
title: Fill in the blanks to find the hidden message
lesson: strings-indexing-and-slicing
difficulty: easy
updated: 2026-10-10
---

## Question

In a secret code, the real message is hidden in every second character, starting from the **second** character. For example, `xCxAxIxRxO` hides `CAIRO`. Fill in the **three blanks**: two numbers in the slice, and the name of a built-in function.

## Code

```python
code = input()
hidden = code[___::___]
print("Message:", hidden)
print("Letters:", ___(hidden))
```

## Expected behavior

The user types the coded text. The program prints `Message:` followed by every second character starting at the second one, then `Letters:` followed by how many characters the message has.

## Tests

### xCxAxIxRxO

```input
xCxAxIxRxO
```

```output
Message: CAIRO
Letters: 5
```

### aHbEcLdLeO

```input
aHbEcLdLeO
```

```output
Message: HELLO
Letters: 5
```

### an odd number of characters

```input
zSzUzN!
```

```output
Message: SUN
Letters: 3
```

## Solution

```python
code = input()
hidden = code[1::2]
print("Message:", hidden)
print("Letters:", len(hidden))
```

## Hints

- Python counts from 0. At which index is the second character?
- The third number in a slice is the step: how many places it jumps each time.
- Which function gives the number of characters in a String?

## Explanation

1. `1`: the second character is at index **1**, because indexes start at 0. With `0` you'd get `xxxxx` instead of `CAIRO`.
2. `2`: the step. `::2` takes every second character: indexes 1, 3, 5, 7, 9.
3. `len`: `len(hidden)` counts the characters of the message.

For `xCxAxIxRxO`: index 1 is `C`, 3 is `A`, 5 is `I`, 7 is `R` and 9 is `O`, so the message is `CAIRO` with 5 letters. In `zSzUzN!` the slice takes indexes 1, 3 and 5 (`S`, `U`, `N`); index 7 doesn't exist, and a slice simply stops at the end.
