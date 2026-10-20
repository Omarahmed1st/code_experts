---
slug: if-even-condition
type: mcq
title: The condition for an even number
lesson: decisions-if-then-else
difficulty: easy
updated: 2026-10-10
---

## Question

A program reads an integer `N`. It should print `EVEN` when `N` is even and `ODD` otherwise:

```pseudocode
IF ______ THEN
    PRINT "EVEN"
ELSE
    PRINT "ODD"
END IF
```

Which condition goes in the blank?

## Options

- [x] `N % 2 == 0`
  Right: `%` gives the remainder after dividing by 2. No remainder means every item has a partner, so N is even.
- [ ] `N / 2 == 0`
  `/` gives the result of the division, not the remainder. For N = 8, `8 / 2` is 4, so 8 would print ODD.
- [ ] `N % 2 = 0`
  One `=` stores a value; it does not compare. A condition needs `==`.
- [ ] `N % 2 == 1`
  This is TRUE for odd numbers, so the two paths would be swapped: 7 would print EVEN.

## Hints

- Which operator gives the **remainder** of a division?
- Test each condition with N = 8 and N = 7.

## Explanation

The remainder after dividing by 2 tells you if a number is even. If the remainder is 0, the number is even; if it is 1, the number is odd. For example, `8 % 2` is 0 (EVEN) and `7 % 2` is 1 (ODD).

`N / 2` is the wrong operator: it gives how many pairs there are, not what is left over. And remember the two kinds of equals: `==` compares, while `=` (or `←` in pseudocode) stores.
