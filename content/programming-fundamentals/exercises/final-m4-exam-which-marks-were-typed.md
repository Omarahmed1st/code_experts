---
slug: final-m4-exam-which-marks-were-typed
type: mcq
title: Which marks were typed?
lesson: exam-results-processor
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This is the exam results processor with the lecture's **bonus**: for each of the 5 marks it prints `EVEN` or `ODD`, then `PASS` or `FAIL`, and at the end the number of passes.

```pseudocode
BEGIN
    counter ← 1
    passCount ← 0
    WHILE counter <= 5 DO
        INPUT mark
        IF mark % 2 == 0 THEN
            PRINT "EVEN"
        ELSE
            PRINT "ODD"
        END IF
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
        ELSE
            PRINT "FAIL"
        END IF
        counter ← counter + 1
    END WHILE
    PRINT passCount
END
```

A teacher ran it, and apart from the marks she typed, it printed these 11 lines:

```output
EVEN
FAIL
ODD
PASS
ODD
FAIL
EVEN
PASS
EVEN
PASS
3
```

Which lists of marks could she have typed? Pick **all** of them.

## Options

- [x] `48 51 49 50 100`
  Right: 48 is even and below 50, 51 is odd and a pass, 49 is odd and a fail, 50 is even and a pass (`50 >= 50`), 100 is even and a pass. Three passes.
- [ ] `50 51 49 50 100`
  The first mark, 50, is a **pass**: `50 >= 50` is TRUE. The output would start `EVEN`, `PASS` and end with 4 passes.
- [x] `0 77 1 62 90`
  Right: 0 is even (`0 % 2` is 0) and a fail, 77 is odd and a pass, 1 is odd and a fail, 62 and 90 are even passes. Three passes.
- [ ] `48 51 49 50 99`
  The first four marks fit, but 99 is **odd** (`99 % 2` is 1), so the ninth line would be `ODD`, not `EVEN`.

## Hints

- Split the output into pairs of lines, one pair per mark. Each pair tells you two facts about that mark: even or odd, and at least 50 or not.
- Check the boundary 50 carefully, and remember what `0 % 2` is.

## Explanation

Work backwards. In every pass the loop prints exactly two lines, so the first 10 lines are 5 pairs, one per mark:

| Mark | Lines | So the mark is… |
|---|---|---|
| 1st | `EVEN`, `FAIL` | even, and less than 50 |
| 2nd | `ODD`, `PASS` | odd, and 50 or more |
| 3rd | `ODD`, `FAIL` | odd, and less than 50 |
| 4th | `EVEN`, `PASS` | even, and 50 or more |
| 5th | `EVEN`, `PASS` | even, and 50 or more |

The last line, `3`, is printed once, after the loop, and agrees with the three `PASS` pairs.

Now test each list against the table. `48 51 49 50 100` and `0 77 1 62 90` fit every row (0 is even, because nothing is left over when 0 is divided by 2). `50 51 …` breaks the first row, because 50 is a pass, not a fail: `>=` includes the boundary. `… 99` breaks the last row, because 99 is odd.

Reading an output backwards like this is a good test of whether you really understand what each line of the algorithm does.
