---
slug: final-m2-pseudo-parcel-price-plan
type: mcq
title: The parcel price plan
lesson: pseudocode-planning-before-code
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A post office charges for a parcel by its weight, in whole kilograms:

| Weight | Price |
|---|---|
| up to 2 kg | 40 pounds |
| 3 to 10 kg | 65 pounds |
| more than 10 kg | 90 pounds |

A student planned it in pseudocode with two separate decisions. Each `IF` has no `ELSE`: when its condition is FALSE, nothing happens and the plan goes on to the next line.

For which weights does this plan print the **wrong** price? Pick **all** of them.

## Code

```pseudocode
BEGIN
    INPUT weight
    price ← 40
    IF weight > 10 THEN
        price ← 90
    END IF
    IF weight > 2 THEN
        price ← 65
    END IF
    PRINT price
END
```

## Options

- [x] 15 kg
  Right, it is wrong for 15: the first `IF` sets `price` to 90, but `15 > 2` is also TRUE, so the second `IF` replaces it with 65. The plan prints 65 instead of 90.
- [x] 11 kg
  Right, it is wrong for 11: `11 > 10` sets 90, then `11 > 2` replaces it with 65. The plan prints 65 instead of 90.
- [ ] 10 kg
  This one is right: `10 > 10` is FALSE, so the first `IF` does nothing. `10 > 2` is TRUE, so `price` becomes 65, the correct price for 10 kg.
- [ ] 2 kg
  This one is right: both conditions are FALSE (`2 > 10` and `2 > 2`), so `price` keeps its starting value, 40.

## Hints

- Trace the plan line by line for each weight. Both `IF`s are checked every time, one after the other.
- A variable keeps only its **last** value. Which `IF` runs last?

## Explanation

The two decisions are separate, so **both** are checked for every weight, in order, and each one can replace the value of `price`.

For any weight above 10 kg, **both** conditions are TRUE. The first `IF` stores 90, and then the second `IF` stores 65 on top of it. A variable holds only its last value, so the plan prints 65 for 11 kg, 15 kg or any heavier parcel. That is wrong for every one of them.

For 3 to 10 kg only the second condition is TRUE, so the price is 65 (right), and for 2 kg or less neither is TRUE, so the price stays 40 (right).

The fix in the plan is to swap the two decisions: check `weight > 2` first and `weight > 10` last, so the highest price is stored last. Tracing the plan with a weight from every row of the table, and with the edges 2, 3, 10 and 11, finds this mistake before any C++ is written.
