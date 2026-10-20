---
slug: flow-match-pseudocode-to-shapes
type: mcq
title: Matching pseudocode to a flowchart
lesson: flowcharts
difficulty: medium
updated: 2026-10-10
---

## Question

Each pseudocode line becomes one flowchart shape. Which flowchart matches this pseudocode, shape by shape, from top to bottom?

## Code

```pseudocode
BEGIN
    INPUT price, quantity
    total ← price * quantity
    PRINT total
END
```

## Options

- [x] oval Start → parallelogram Input price, quantity → rectangle total ← price * quantity → parallelogram Print total → oval End
  Right: input and output in parallelograms, the calculation in a rectangle, ovals at both ends, all in the same order as the pseudocode.
- [ ] oval Start → rectangle Input price, quantity → rectangle total ← price * quantity → rectangle Print total → oval End
  Input and output go in parallelograms, not rectangles. Only the calculation is a rectangle.
- [ ] oval Start → parallelogram Input price, quantity → diamond total ← price * quantity → parallelogram Print total → oval End
  A diamond is a decision with YES and NO exits. A calculation asks no question, so it is a rectangle.
- [ ] oval Start → parallelogram Input price, quantity → parallelogram Print total → rectangle total ← price * quantity → oval End
  The shapes are right, but the order is wrong: this prints `total` before it is calculated.

## Hints

- For each line, ask: is it start/end, input/output, a calculation or a decision?
- Does the order of the shapes have to follow the order of the lines?

## Explanation

The three representations match **line by line**:

| Pseudocode | Flowchart shape |
|---|---|
| `BEGIN` | oval: Start |
| `INPUT price, quantity` | parallelogram |
| `total ← price * quantity` | rectangle |
| `PRINT total` | parallelogram |
| `END` | oval: End |

The order matters too: the arrows must follow the same order as the pseudocode, so the total is calculated before it is printed. This is a straight-line algorithm, so there is no diamond.
