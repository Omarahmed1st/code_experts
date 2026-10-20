---
slug: obj-value-popped-item
type: trace
ask: value
title: Which item did pop() give back?
lesson: objects-and-methods
difficulty: medium
updated: 2026-10-16
---

## Question

What is the value of `last` **when the last line runs**? Type the word only, without quotes.

## Code

```python
items = ["pen"]
items.append("book")
items.insert(0, "bag")
items.sort()
last = items.pop()
print(len(items))
```

```python verify
items = ["pen"]
items.append("book")
items.insert(0, "bag")
items.sort()
last = items.pop()
print(last)
```

## Answer

```output
pen
```

## Hints

- Write the List out after every line.
- `sort()` puts words in alphabetical order. `pop()` with no argument removes the **last** item and gives it back.

## Explanation

Follow the List object as each method changes it:

1. `["pen"]`
2. `append("book")` adds to the end: `["pen", "book"]`
3. `insert(0, "bag")` puts `"bag"` at index 0: `["bag", "pen", "book"]`
4. `sort()` puts them in alphabetical order: `["bag", "book", "pen"]`
5. `pop()` removes the last item and gives it back, so `last` is **pen**, and the List is left with `["bag", "book"]`.

If you answered `book`, you probably used the order before `sort()`.
