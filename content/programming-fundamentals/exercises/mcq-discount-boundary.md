---
slug: mcq-discount-boundary
type: mcq
title: The right condition for a discount
lesson: decisions-if-then-else
difficulty: medium
multiple: true
updated: 2026-10-09
---

## Question

A shop gives a discount when the bill is **500 pounds or more**. The bill is stored in `int bill;` (whole pounds only). Which conditions are correct for `if ( … )`? Pick **all** the correct ones.

## Options

- [x] `bill >= 500`
  Right: "500 or more" is exactly what `>=` means, and 500 itself is included.
- [x] `bill > 499`
  Right, because `bill` is an `int`: the smallest whole number above 499 is 500. (It would be wrong for a `float` bill such as 499.5.)
- [ ] `bill > 500`
  Wrong at the boundary: a bill of exactly 500 gives `500 > 500`, which is false, so no discount.
- [ ] `bill == 500`
  This is true only for a bill of exactly 500. A bill of 750 would get no discount.

## Hints

- Test each condition with three bills: 499, 500 and 750.
- `bill` is an `int`. Which whole numbers make `bill > 499` true?

## Explanation

Always test a condition with the **boundary value**, here 500, and the values next to it.

| Condition | 499 | 500 | 750 |
|---|---|---|---|
| `bill >= 500` | false | true | true |
| `bill > 499` | false | true | true |
| `bill > 500` | false | **false** | true |
| `bill == 500` | false | true | **false** |

Only the first two give the right answer for all three bills. `bill >= 500` is the clearest way to write it, because it says "500 or more" directly.
