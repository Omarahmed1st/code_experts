---
slug: final-m2-exam-update-inside-then
type: mcq
title: The update moved into THEN
lesson: exam-results-processor
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A student copied the exam results processor, but put the update `counter ← counter + 1` **inside the THEN path**, instead of after `END IF`. Everything else is as in the lecture.

The teacher types the lecture's test data, one mark at a time: `72`, `45`, `50`, `38`, `90`. Which statements are **true**? Pick **all** the true ones.

## Code

```pseudocode
BEGIN
    counter ← 1
    passCount ← 0
    WHILE counter <= 5 DO
        INPUT mark
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
            counter ← counter + 1
        ELSE
            PRINT "FAIL"
        END IF
    END WHILE
    PRINT passCount
END
```

## Options

- [x] After the fifth mark, `90`, the algorithm asks for **another** mark.
  Right: only the three passing marks moved `counter`, so it is 4 after the five marks. `4 <= 5` is TRUE, so the loop runs again and waits for a sixth mark.
- [x] Whenever the algorithm does finish, it prints `5`.
  Right: `passCount` and `counter` now always go up **together**. The loop stops when `counter` reaches 6, and at that moment `passCount` is exactly 5.
- [ ] It prints `3` after the fifth mark, because three of the five marks are passes.
  It never reaches `PRINT passCount` after five marks: the two FAIL marks didn't move `counter`, so the loop isn't finished yet.
- [ ] It can never stop, whatever marks are typed.
  It does stop, once 5 marks of 50 or more have been typed. Each pass moves `counter` by 1, and the fifth pass makes `6 <= 5` FALSE.

## Hints

- Trace `counter` for the five marks. Which marks change it?
- Compare `counter` and `passCount` after each PASS. What do you notice?

## Explanation

The update decides when a loop can stop. In the lecture it runs once for **every** student, after `END IF`, so exactly 5 marks are read. Here it only runs on the PASS path, so the loop now counts **passing** marks, not students.

| mark | Output | passCount | counter |
|---|---|---|---|
| 72 | PASS | 1 | 2 |
| 45 | FAIL | 1 | 2 |
| 50 | PASS | 2 | 3 |
| 38 | FAIL | 2 | 3 |
| 90 | PASS | 3 | 4 |

After five marks, `4 <= 5` is still TRUE, so the algorithm asks for a sixth mark. It keeps reading until two more passes are typed. Because `passCount` and `counter` rise together (`counter` is always `passCount + 1`), the loop ends exactly when `passCount` is 5, so it always prints `5`, however many students failed. A FAIL never moves the counter, so the update must sit **after** `END IF`, where both paths reach it.
