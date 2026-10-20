---
slug: final-m3-flow-count-the-shapes
type: mcq
title: How many shapes of each kind?
lesson: flowcharts
difficulty: medium
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A student will draw the flowchart for this pseudocode, with **one shape for each step**, following the rules from the lecture.

```pseudocode
BEGIN
    INPUT length, width
    area ← length * width
    perimeter ← 2 * (length + width)
    IF area > 50 THEN
        PRINT "Big room"
    ELSE
        PRINT "Small room"
    END IF
    PRINT area, perimeter
END
```

Which statements about the finished flowchart are **true**? Pick **all** the true ones.

## Options

- [x] It has exactly one diamond, with a YES exit and a NO exit.
  Right: the only question is `area > 50?`. Every decision is one diamond with exactly two exits.
- [x] It has four parallelograms.
  Right: one for `INPUT length, width` and three for the `PRINT` steps: `"Big room"`, `"Small room"` and `area, perimeter`.
- [ ] It has three rectangles: one for each calculation and one for the decision.
  A decision goes in a diamond, not a rectangle. There are only two rectangles, one for `area ← …` and one for `perimeter ← …`.
- [ ] It has two End ovals, one at the end of each path of the decision.
  The YES and NO paths join again after the decision and lead to `PRINT area, perimeter`, so there is one Start oval and one End oval.

## Hints

- Sort the steps: which ones read or print (parallelogram), which calculate (rectangle), which ask a question (diamond)?
- After `END IF`, do the two paths still go separately, or do they meet again?

## Explanation

Each step becomes one shape:

| Step | Shape |
|---|---|
| `BEGIN`, `END` | 2 ovals (one Start, one End) |
| `INPUT length, width` | parallelogram |
| `area ← length * width` | rectangle |
| `perimeter ← 2 * (length + width)` | rectangle |
| `IF area > 50` | diamond, with YES and NO exits |
| `PRINT "Big room"` (YES path) | parallelogram |
| `PRINT "Small room"` (NO path) | parallelogram |
| `PRINT area, perimeter` | parallelogram |

So the chart has 2 ovals, 4 parallelograms, 2 rectangles and 1 diamond. Input and output always go in parallelograms, calculations in rectangles, and questions in diamonds. The two paths of the decision join again before `PRINT area, perimeter`, so the chart has a single End.
