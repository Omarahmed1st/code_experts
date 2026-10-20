---
slug: final-m4-pseudo-which-plans-work
type: mcq
title: Four plans for the phone covers
lesson: pseudocode-planning-before-code
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

**Problem:** a shop sells phone covers for 75 pounds each. Students get 15 pounds off **each** cover. The program reads the number of covers, then whether the buyer is a student (the user types `1` for yes, `0` for no). For a student it prints `Student discount`, otherwise `Full price`. Then it prints the total.

Four students wrote a plan:

**Plan A**

```pseudocode
BEGIN
    INPUT covers
    INPUT student
    total ← covers * 75
    IF student == 1 THEN
        total ← total - covers * 15
        PRINT "Student discount"
    ELSE
        PRINT "Full price"
    END IF
    PRINT total
END
```

**Plan B**

```pseudocode
BEGIN
    INPUT covers
    INPUT student
    total ← covers * 75
    IF student == 1 THEN
        total ← total - 15
        PRINT "Student discount"
    ELSE
        PRINT "Full price"
    END IF
    PRINT total
END
```

**Plan C**

```pseudocode
BEGIN
    INPUT covers
    INPUT student
    IF student == 1 THEN
        price ← 60
        PRINT "Student discount"
    ELSE
        PRINT "Full price"
    END IF
    price ← 75
    total ← covers * price
    PRINT total
END
```

**Plan D**

```pseudocode
BEGIN
    INPUT covers
    INPUT student
    price ← 75
    IF student == 1 THEN
        price ← 60
        PRINT "Student discount"
    ELSE
        PRINT "Full price"
    END IF
    total ← covers * price
    PRINT total
END
```

Which plans solve the problem correctly for **every** input? Pick **all** of them. (Test each plan with a student buying 3 covers: the total should be 3 × 60 = 180.)

## Options

- [x] Plan A
  Right: it takes 15 off for **each** cover with `covers * 15`. For 3 covers: 225 − 45 = 180.
- [ ] Plan B
  It takes 15 pounds off only **once**, whatever the number of covers. For 3 covers it prints 225 − 15 = 210. It only works when a student buys exactly 1 cover.
- [ ] Plan C
  The steps run in order, so `price ← 75` **after** the decision replaces the 60. Students still see `Student discount` but pay 75 a cover: 225 for 3 covers.
- [x] Plan D
  Right: `price` starts at 75 and the decision lowers it to 60 for a student, **before** the total is calculated. For 3 covers: 3 × 60 = 180.

## Hints

- Test every plan with the same case: a student (`1`) buying 3 covers. Write down the value of each variable after each line.
- "15 pounds off **each** cover": does the plan's discount grow with the number of covers?

## Explanation

Planning in pseudocode is where logic errors are cheapest to catch. Test each plan by hand with one case that you can check, such as a student buying 3 covers (expected total: 3 × 60 = 180).

- **Plan A** calculates the full price, 3 × 75 = 225, then removes 15 for each cover: 225 − 3 × 15 = 180. Correct.
- **Plan B** removes 15 only once: 210. The problem said "15 pounds off **each** cover", so this misreads the problem. Testing it with 1 cover would hide the mistake, which is why 3 covers is a better test.
- **Plan C** sets the student price, but the line `price ← 75` comes after the decision and overwrites it. Every buyer pays 75 a cover. The order of the steps matters as much as the steps themselves.
- **Plan D** sets the normal price **first**, then lets the decision change it, and only then multiplies. Correct, and a different way to reach the same result as Plan A.

There is often more than one correct plan. What matters is that every step is in the right place and does exactly what the problem says.
