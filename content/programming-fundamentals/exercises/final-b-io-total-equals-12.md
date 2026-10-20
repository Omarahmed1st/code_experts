---
slug: final-b-io-total-equals-12
type: mcq
title: Which lines print Total = 12?
lesson: input-and-output-with-cout-and-cin
difficulty: medium
reserved: true
multiple: true
updated: 2026-10-10
---

## Question

Which of these print **exactly** `Total = 12` on one line, followed by a line break? Pick **all** of them.

## Options

- [x] `cout << "Total = " << 25 / 2 << endl;`
  Correct: `25 / 2` is `int / int`, so it gives 12 (the .5 is cut off). The line prints `Total = 12`.
- [x] `cout << "Total = "; cout << 3 * 4 << "\n";`
  Correct: the first `cout` has no line break, so the second continues on the same line. `"\n"` then ends the line, just like `endl`.
- [ ] `cout << "Total = " << endl << 12 << endl;`
  Wrong: the `endl` in the middle ends the line after `Total = `, so `12` appears on a second line.
- [ ] `cout << "Total = " << 25.0 / 2 << endl;`
  Wrong: `25.0` is a decimal number, so the division keeps the decimal part. It prints `Total = 12.5`.

## Hints

- Does `cout` start a new line by itself? What do `endl` and `"\n"` do?
- Work out each calculation with its types: `int / int` or a decimal division?

## Explanation

`cout` prints its values in order and starts a new line only where it meets `endl` or `\n`.

- Splitting the output into two `cout` statements is fine, as long as the first one has no line break. `"\n"` at the end does the same job as `endl`.
- An `endl` in the middle of the chain breaks the line too early, so the text and the number end up on two lines.

The calculations matter as well. `25 / 2` uses two `int` values, so it gives 12, exactly what we want here. `25.0 / 2` uses a decimal number and gives 12.5. The same "divide by 2" gives two different results because of the types.
