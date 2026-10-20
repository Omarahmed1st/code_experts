---
slug: final-m3-pseudo-taxi-plan-checks
type: mcq
title: Checking the taxi fare plan
lesson: pseudocode-planning-before-code
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

**Problem:** a taxi charges 9 pounds to start, plus 4.5 pounds for every kilometre. A trip can be a decimal number of kilometres, such as 2.5 km. Read the kilometres, print `Expensive` if the fare is more than 50 pounds and `OK` otherwise, then print the fare.

A student followed the three steps (identify the variables, choose their data types, write the pseudocode) and wrote:

```pseudocode
BEGIN
    INPUT km
    fare ← 9 + km * 4.5
    IF fare > 50 THEN
        PRINT "Expensive"
    ELSE
        PRINT "OK"
    END IF
    PRINT fare
END
```

Which statements are **true**? Pick **all** the true ones.

## Options

- [x] `km` and `fare` should both be `float` (or `double`), because a trip can be 2.5 km and a fare can have piastres.
  Right: for 2.5 km the fare is 9 + 11.25 = 20.25 pounds. An `int` would lose the decimal part of both values.
- [x] For a trip of 9 km, the plan prints `OK` and then `49.5`.
  Right: `*` comes before `+`, so the fare is 9 + (9 × 4.5) = 9 + 40.5 = 49.5. `49.5 > 50` is FALSE, so the ELSE path prints `OK`.
- [ ] The line `fare ← 9 + km * 4.5` adds 9 and `km` first, so it must be rewritten as `fare ← (9 + km) * 4.5`.
  Multiplication comes before addition, so the plan already works out `km * 4.5` first and then adds the 9 pounds once. The brackets would charge 4.5 pounds for the 9 starting pounds as well.
- [ ] Pseudocode has no strict rules, so `km` and `fare` won't need a data type when the plan is turned into C++.
  Pseudocode has no strict syntax, but C++ does: every variable must be declared with a type before it is used. That is why choosing the data types is one of the three steps.

## Hints

- Can the number of kilometres or the fare have a decimal part?
- Work out the fare for 9 km. Which comes first, the `+` or the `*`?

## Explanation

The three steps are: identify the variables (`km`, `fare`), choose their data types, and write the pseudocode.

- **Data types.** The problem says a trip can be 2.5 km, and 4.5 pounds per km gives fares with piastres, so both variables need `float` (or `double`). Choosing the types now prevents losing decimals later in C++, where every variable must be declared with a type.
- **The formula is right.** As in maths, `*` is done before `+`, so `9 + km * 4.5` means the starting 9 pounds plus 4.5 pounds per kilometre. Adding brackets around `9 + km` would change the meaning and give a wrong fare.
- **A trace with 9 km**: fare = 9 + 40.5 = 49.5, which is not more than 50, so the plan prints `OK`, then `49.5`.
