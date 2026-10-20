---
slug: count-py-cart-loop-rounds
type: trace
ask: count
title: How many rounds does the cart loop make?
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

A shopping cart holds prices. The List is changed a few times before the total is worked out. **How many times does the body of the `for` loop run?** Type a number.

## Code

```python
cart = [25, 40, 15]
cart.append(10)
cart.insert(1, 30)
cart.remove(40)
cart.pop()
total = 0
for price in cart:
    total = total + price
print("Total:", total)
```

```python verify
cart = [25, 40, 15]
cart.append(10)
cart.insert(1, 30)
cart.remove(40)
cart.pop()
rounds = 0
for price in cart:
    rounds = rounds + 1
print(rounds)
```

## Answer

```output
3
```

## Hints

- A `for` loop over a List runs once for each item, so you need the List as it is when the loop starts.
- Write the whole List down after every line.

## Explanation

The loop runs once per item, so follow the List line by line:

| Line | What happens | cart |
|---|---|---|
| 1 | make the List | `[25, 40, 15]` |
| 2 | `append(10)` adds 10 to the end | `[25, 40, 15, 10]` |
| 3 | `insert(1, 30)` puts 30 at index 1 | `[25, 30, 40, 15, 10]` |
| 4 | `remove(40)` deletes the value 40 | `[25, 30, 15, 10]` |
| 5 | `pop()` takes out the last item, 10 | `[25, 30, 15]` |

When the loop starts the List has 3 items, so the body runs **3** times and the program prints `Total: 70`.
