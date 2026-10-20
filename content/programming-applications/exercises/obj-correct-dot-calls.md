---
slug: obj-correct-dot-calls
type: correct_code
title: Fix the two method calls
lesson: objects-and-methods
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads a friend's name, adds it to the List and prints the name in capitals, then the whole List. Two method calls are written wrongly. Fix them.

## Code

```python
friends = ["Ali", "Sara"]
name = input()
friends.append name
print(name.upper)
print(friends)
```

## Expected behavior

The user types a name. The program prints the name in capital letters, then the List with the new name added at the end.

## Tests

### Omar

```input
Omar
```

```output
OMAR
['Ali', 'Sara', 'Omar']
```

### mona

```input
mona
```

```output
MONA
['Ali', 'Sara', 'mona']
```

## Solution

```python
friends = ["Ali", "Sara"]
name = input()
friends.append(name)
print(name.upper())
print(friends)
```

## Hints

- Every method call has brackets after the method's name, even when there is nothing inside them.
- Where does the argument of a method go?

## Explanation

A method call always has the pattern `object.method(argument)`:

1. `friends.append name` is missing the brackets, which is a `SyntaxError`. The argument goes **inside** them: `friends.append(name)`.
2. `name.upper` names the method but doesn't call it, so `print` would show something like `<built-in method upper of str object at …>` instead of the capitals. `upper()` needs no argument, but the brackets are still required: `name.upper()`.
