---
slug: gfx-value-click-message
type: trace
ask: value
title: Build a message from a click
lesson: mouse-clicks
difficulty: hard
updated: 2026-10-16
---

## Question

In this program a Point stands in for a click at (45, 380). What is the value of `msg` **when the last line runs**? Type the text exactly, without quotes.

## Code

```python
from graphics import *

click = Point(45, 380)
x = int(click.getX())
y = click.getY()
msg = "Clicked at " + str(x) + ", " + str(y)
print("Message ready")
```

```python verify
from graphics import *

click = Point(45, 380)
x = int(click.getX())
y = click.getY()
msg = "Clicked at " + str(x) + ", " + str(y)
print(msg)
```

## Answer

```output
Clicked at 45, 380.0
```

## Hints

- graphics.py keeps a Point's coordinates as decimals.
- Only one of the two coordinates goes through `int()`.

## Explanation

`Point(45, 380)` stores 45.0 and 380.0.

1. `x = int(click.getX())` turns 45.0 into the whole number **45**.
2. `y = click.getY()` keeps the decimal **380.0**, because there is no `int()` on this line.
3. `str()` turns each number into text, and `+` joins the pieces: `"Clicked at " + "45" + ", " + "380.0"`.

So `msg` is **Clicked at 45, 380.0**. This is why the interactive target program uses `int()` on both coordinates.
