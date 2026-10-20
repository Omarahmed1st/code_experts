---
slug: blanks-py-homework-list
type: correct_code
ask: blanks
title: Fill in the blanks for the homework list
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

Karim keeps his homework in a List. An urgent task is typed in and must go to the **front** of the List. Then he finishes the **last** task in the List and takes it out. Fill in the **four blanks**: the first two are List methods, the third is an index, the fourth is a built-in function.

## Code

```python
tasks = ["math", "physics", "art"]
urgent = input()
tasks.___(0, urgent)
done = tasks.___()
print("Next:", tasks[___])
print("Done:", done)
print("Left:", ___(tasks))
```

## Expected behavior

The user types one task. The program puts it at index 0, removes the last task, and prints three lines. For `english` it prints:

```
Next: english
Done: art
Left: 3
```

## Tests

### english

```input
english
```

```output
Next: english
Done: art
Left: 3
```

### chemistry

```input
chemistry
```

```output
Next: chemistry
Done: art
Left: 3
```

## Solution

```python
tasks = ["math", "physics", "art"]
urgent = input()
tasks.insert(0, urgent)
done = tasks.pop()
print("Next:", tasks[0])
print("Done:", done)
print("Left:", len(tasks))
```

## Hints

- Which method adds an item at a position you choose? Which one only adds to the end?
- Which method takes out the last item **and gives it back**, so it can be stored in `done`?

## Explanation

1. `insert`: `tasks.insert(0, urgent)` puts the urgent task at index 0, the front. `append` would put it at the end, and it takes only one value.
2. `pop`: `tasks.pop()` removes the **last** item and gives it back, so `done` becomes `"art"`. `remove` needs a value in the brackets and gives nothing back.
3. `0`: the next task is the one at the front, index 0.
4. `len`: `len(tasks)` counts the items left.

Follow the List for `english`:

| After | tasks |
|---|---|
| line 1 | `["math", "physics", "art"]` |
| `insert(0, "english")` | `["english", "math", "physics", "art"]` |
| `pop()` | `["english", "math", "physics"]`, and `done` is `"art"` |

So the program prints `Next: english`, `Done: art` and `Left: 3`.
