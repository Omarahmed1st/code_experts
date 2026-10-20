---
slug: colors-moving-and-text
title: Colours, moving and text
topic: python-graphics
lecture: 3
difficulty: easy
description: Change graphical objects with their methods. Colour the inside and the edge of a shape, move it with move(dx, dy), and change the size and colour of text.
objectives:
  - Use draw(), setFill(), setOutline() and move() on a shape
  - Write colours as Strings, or mix your own with color_rgb()
  - Predict where a shape ends up after move(dx, dy)
  - Change a Text object's size and colour
prerequisites:
  - Drawing shapes
related:
  - drawing-shapes
  - mouse-clicks
updated: 2026-10-15
---

## [explanation] Object methods in graphics

Shapes are objects, so they have methods, called with the same dot notation as `name.upper()`:

```python
circle.draw(win)
circle.setFill("blue")
circle.setOutline("black")
circle.move(20, 0)
```

`circle` is the **object**; `draw`, `setFill`, `setOutline` and `move` are its **methods**. Each method does one job:

| Method | What it does |
|---|---|
| `draw(win)` | shows the shape in the window `win` |
| `setFill(color)` | colours the **inside** of the shape |
| `setOutline(color)` | colours the **edge** of the shape |
| `move(dx, dy)` | shifts the shape's position |

Which method would you use to make a shape's edge red? `setOutline("red")`.

## [code] Colouring a circle

```python program
from graphics import *

win = GraphWin("Colors", 500, 400)
circle = Circle(Point(250, 200), 80)
circle.setFill("blue")
circle.setOutline("black")
circle.draw(win)
win.getMouse()
win.close()
```

```notes
5 | setFill | the inside | circle sky
6 | setOutline | the edge | square yel
5 | "blue" | colours are Strings | diamond green
```

## [diagram] A filled circle

![A 500 by 400 window with a circle in the centre, filled solid blue with a black edge](images/py-colors.png)

A new shape starts **empty** (no fill) with a **black outline**, like the circles in the last lecture. After `setFill("blue")` it is filled. You can set colours before or after `draw()`: the window updates either way.

## [explanation] Writing colours

Colour names are **Strings**, so they need quotes. Common ones are `"red"`, `"blue"`, `"green"`, `"yellow"`, `"black"` and `"white"`; the library understands many more, such as `"orange"`, `"purple"`, `"pink"` and `"gray"`.

For any other colour, mix it yourself with `color_rgb(red, green, blue)`. Each amount is from 0 to 255: `color_rgb(255, 120, 0)` is orange, and `color_rgb(0, 0, 0)` is black.

## [code] A row of colours

```python program
from graphics import *

win = GraphWin("Colour Row", 500, 160)
colors = ["red", "green", "blue", "yellow", "black", color_rgb(255, 120, 0)]
x = 50
for color in colors:
    dot = Circle(Point(x, 80), 30)
    dot.setFill(color)
    dot.draw(win)
    x = x + 80
win.getMouse()
win.close()
```

```notes
4 | color_rgb(255, 120, 0) | mix your own: orange | circle sky
6 | for color in colors | one circle per colour | square yel
10 | x + 80 | the next one, 80 to the right | diamond green
```

## [diagram] Six filled circles

![A wide window with six circles in a row, filled red, green, blue, yellow, black and orange](images/py-color-row.png)

The `for` loop from the Lists lecture creates one Circle object per colour, each 80 pixels to the right of the last.

## [explanation] Moving objects

`move(dx, dy)` shifts an object by **dx** pixels sideways and **dy** pixels up or down:

| Call | Moves the shape |
|---|---|
| `move(50, 0)` | 50 pixels **right** (positive dx) |
| `move(-50, 0)` | 50 pixels **left** (negative dx) |
| `move(0, 50)` | 50 pixels **down** (positive dy) |
| `move(0, -50)` | 50 pixels **up** (negative dy) |

Because y grows downward, a **positive dy moves down**. That is the most common surprise.

`move()` shifts the **same object**. It doesn't draw a copy: the shape disappears from its old place and appears in the new one.

## [code] Moving a circle three times

The first `getMouse()` lets you see the circle where it starts. After your click, it moves 50 pixels right three times, and the second `getMouse()` keeps the window open so you can see where it ended up.

```python program
from graphics import *

win = GraphWin("Moving", 500, 400)
circle = Circle(Point(250, 200), 50)
circle.setFill("yellow")
circle.draw(win)
win.getMouse()
circle.move(50, 0)
circle.move(50, 0)
circle.move(50, 0)
win.getMouse()
win.close()
```

```notes
7 | getMouse | wait: see the start | circle sky
8 | move(50, 0) | 50 right, each time | square yel
11 | getMouse | wait: see the end | diamond green
```

## [diagram] 150 pixels to the right

![A 500 by 400 window. A dashed outline shows where the circle started, centred at (250, 200). A yellow circle is drawn 150 pixels to the right, centred at (400, 200)](images/py-move.png)

Three calls of `move(50, 0)` move the circle **150 pixels** to the right in total, so its center goes from (250, 200) to **(400, 200)**. The dashed outline was added to the picture to show where it started; the real window only shows the circle in its new place.

## [explanation] Adding text

`Text(point, string)` is another graphical object: a Point for its position, and the String to show. The text is **centered on the Point**, not started from it.

| Method | What it does |
|---|---|
| `setSize(size)` | the font size; graphics.py accepts sizes from 5 to 36 |
| `setTextColor(color)` | the colour of the letters |
| `setText(string)` | changes the words |

## [code] A blue title

```python program
from graphics import *

win = GraphWin("Text", 500, 400)
message = Text(
    Point(250, 50),
    "Hello Python"
)
message.draw(win)
message.setSize(20)
message.setTextColor("blue")
win.getMouse()
win.close()
```

```notes
5 | Point(250, 50) | the centre of the text | circle sky
9 | setSize(20) | bigger letters | square yel
10 | setTextColor | blue letters | diamond green
```

## [diagram] Text centered on (250, 50)

![A 500 by 400 window with the words Hello Python in blue near the top, centred on the point (250, 50), which is marked](images/py-text.png)

Same pattern as before: create the object, call its methods, draw it. To put a caption near the bottom of the window, you would use a Text at about `Point(250, 370)`.

## [note] Check yourself

::: check A circle is centered at (100, 100). Where is its center after `move(30, -20)` and then `move(0, 50)`?
???
**(130, 130)**. x: 100 + 30 + 0 = 130. y: 100 − 20 + 50 = 130. The first move goes right and **up** (negative dy), the second goes **down**.
:::

::: check What does `message.setSize(40)` do?
???
It stops the program with `GraphicsError: Illegal option value`, because graphics.py only accepts text sizes from 5 to 36.
:::

## [common_mistakes] Common mistakes

- **Colours without quotes.** `setFill(blue)` makes Python look for a variable called `blue`: `NameError`. Write `setFill("blue")`.
- **A misspelt colour.** `setFill("bleu")` stops with an error from Tkinter (`unknown color name "bleu"`).
- **Moving up with a positive dy.** `move(0, 50)` moves **down**. Up is `move(0, -50)`.
- **Expecting move() to leave a copy.** It moves the same object; to have two shapes, create two objects.

## [key_takeaways] Key takeaways

- Shapes are objects with methods: `draw()`, `setFill()`, `setOutline()` and `move()`.
- Colours are Strings like `"blue"`, or `color_rgb(r, g, b)` with amounts from 0 to 255.
- `move(dx, dy)` shifts the same object: positive dx is right, **positive dy is down**.
- `Text(point, string)` is centered on its Point; `setSize()` (5 to 36) and `setTextColor()` change its look.
