---
slug: intro-print-commas-space
type: mcq
title: Three items in one print
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

What does this line print?

## Code

```python
print("Total:", 15, "marks")
```

## Options

- [x] `Total: 15 marks`
  Right: the commas separate three items, and `print` puts one space between each pair.
- [ ] `Total:15marks`
  `print` adds a space between items given with commas.
- [ ] `"Total:" 15 "marks"`
  The quotes only mark where the text starts and ends; they are not printed.
- [ ] `Total:, 15, marks`
  The commas belong to the code. They separate the items and are not printed.

## Answer

```output
Total: 15 marks
```

## Explanation

`print` can take several items separated by commas. It prints them all on one line, with **one space** between them, and without the quotes. So the text `Total:`, the number `15` and the text `marks` become `Total: 15 marks`.
