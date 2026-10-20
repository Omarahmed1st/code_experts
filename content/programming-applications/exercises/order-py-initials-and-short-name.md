---
slug: order-py-initials-and-short-name
type: correct_code
ask: order
title: Put the initials program in order
lesson: strings-indexing-and-slicing
difficulty: easy
updated: 2026-10-10
---

## Question

The program reads a first name and then a family name. It prints the person's initials, then a short name made of the first 3 letters of each name. Move the mixed-up lines into the right order.

## Code

```python
# [order]
first = input()
last = input()
initials = first[0] + last[0]
print("Initials:", initials)
print("Short name:", first[:3] + last[:3])
# [/order]
```

## Expected behavior

The user types a first name on one line and a family name on the next. For `Mona` and `Hassan` the program prints:

```
Initials: MH
Short name: MonHas
```

## Tests

### Mona Hassan

```input
Mona
Hassan
```

```output
Initials: MH
Short name: MonHas
```

### Omar Ali

```input
Omar
Ali
```

```output
Initials: OA
Short name: OmaAli
```

## Hints

- The first name is typed first, so the first `input()` belongs to `first`.
- A variable has to get its value before a line can use it.

## Explanation

1. `first = input()` reads the first name, because it is typed first.
2. `last = input()` reads the family name.
3. `initials = first[0] + last[0]` joins the character at index 0 of each name. It needs both names, so it comes after both `input()` lines.
4. `print("Initials:", initials)` prints the initials. It needs `initials`, so it comes after line 3.
5. `print("Short name:", ...)` comes last, because the expected output shows the short name on the second line. `first[:3]` is the slice from index 0 up to, but not including, index 3.

If you swap the two `input()` lines, the names land in the wrong variables: Mona Hassan would get the initials `HM`. No two lines can swap here.
