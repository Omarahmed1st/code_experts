---
slug: mouse-clicks
title: Mouse clicks and an interactive target
topic: python-graphics
lecture: 3
difficulty: medium
description: getMouse() does more than pause a program. It returns the click as a Point object, so a program can draw where the user clicks. Finish with an interactive target that reports where it was hit.
objectives:
  - Explain what getMouse() returns
  - Read a click's coordinates with getX() and getY()
  - Use a click Point as the center of a new shape
  - Build a complete interactive program from windows, shapes, text and clicks
prerequisites:
  - Colours, moving and text
related:
  - colors-moving-and-text
  - graphics-practice-and-debugging
updated: 2026-10-15
---

## [explanation] getMouse() gives you a Point

Until now, `win.getMouse()` only paused the program until a click. It actually **gives something back**: a **Point object** describing where the user clicked.

```python
click = win.getMouse()
```

Three things happen on this line:

1. `getMouse()` **waits** until the user clicks inside the window.
2. It **returns a Point object** at the click position.
3. `click` refers to that Point, so you can call its methods: `click.getX()` and `click.getY()` read its coordinates.

## [code] Where did you click?

```python program
from graphics import *

win = GraphWin("Where did you click?", 500, 400)
click = win.getMouse()
print(click.getX())
print(click.getY())
win.close()
```

```notes
4 | getMouse | waits, then returns a Point | circle sky
5 | getX | how far right | square yel
6 | getY | how far down | diamond green
```

## [diagram] A click at (320, 180)

![A 500 by 400 window titled Where did you click? A mouse pointer marks a click 320 pixels from the left and 180 pixels from the top, labelled click at (320, 180)](images/py-click.png)

For a click at (320, 180), the program prints the two coordinates, 320 and 180, in the terminal, not in the window. Current versions of graphics.py store coordinates as decimals, so they appear as `320.0` and `180.0`. You will see different numbers, because you will click somewhere else. Try clicking near each corner: the numbers should match the coordinate system from the windows lecture.

## [code] Click to create a circle

This is our first interactive program. The click Point is used **directly** as the center of a new Circle.

```python program
from graphics import *

win = GraphWin("Click Example", 500, 400)
click = win.getMouse()
circle = Circle(click, 30)
circle.setFill("blue")
circle.draw(win)
win.getMouse()
win.close()
```

```notes
4 | click | a Point object | circle sky
5 | Circle(click, 30) | the click is the center | square yel
8 | getMouse | keep it open | diamond green
```

## [diagram] A blue circle where the user clicked

![A 500 by 400 window with a blue circle of radius 30 centred on the click at (320, 180)](images/py-click-circle.png)

Follow the chain: **user click → `win.getMouse()` → a Point, `click` → `Circle(click, 30)` → `circle.draw(win)`**. The second `getMouse()` keeps the window open until another click, then `close()` ends the program.

What type of object is `click`? A **Point**. What changes if you replace 30 with 60? The circle becomes twice as wide; its center is still wherever the user clicked.

## [note] Check yourself

::: check A program runs `click = win.getMouse()` and the user clicks at (120, 340). What does `Circle(click, 20)` cover?
???
A circle centered at (120, 340) with radius 20: from x = 100 to 140 and from y = 320 to 360.
:::

## [explanation] Mini project: an interactive target

Build it in seven steps, using only what you have learned:

1. Open a graphics window.
2. Draw three circles with different sizes.
3. Give them different colours.
4. Add a title with a Text object.
5. Wait for a mouse click.
6. Draw a small circle where the user clicked.
7. Display the click coordinates as text.

Steps 1 to 4 build the picture; steps 5 to 7 make it interactive. Two hints:

- Draw the **biggest circle first**, so the smaller ones appear on top of it.
- For step 7, build the message with `+` and `str()`, which turns a number into text.

Try it before you read the complete program below.

## [code] Interactive target: the complete program

```python program
from graphics import *

win = GraphWin("Interactive Target", 500, 500)

title = Text(Point(250, 40), "Click the Target!")
title.setSize(24)
title.draw(win)

outer = Circle(Point(250, 270), 150)
outer.setFill("red")
outer.draw(win)
middle = Circle(Point(250, 270), 100)
middle.setFill("white")
middle.draw(win)
inner = Circle(Point(250, 270), 50)
inner.setFill("blue")
inner.draw(win)

click = win.getMouse()
dot = Circle(click, 8)
dot.setFill("yellow")
dot.draw(win)

x = int(click.getX())
y = int(click.getY())
msg = "Clicked at " + str(x) + ", " + str(y)
info = Text(Point(250, 470), msg)
info.draw(win)

win.getMouse()
win.close()
```

```notes
6 | setSize(24) | a big title | circle sky
9 | outer | biggest first | square yel
20 | Circle(click, 8) | a dot where you clicked | diamond green
24 | int( | drop the .0 | tri coral
26 | str(x) | a number as text | circle green
30 | getMouse | wait before closing | square sky
```

## [diagram] The target after a click at (310, 230)

![A 500 by 500 window titled Interactive Target. The title Click the Target! is at the top. Below it are three circles sharing one centre, red outside, white in the middle and blue inside, with a small yellow dot where the user clicked, and the text Clicked at 310, 230 at the bottom](images/py-target.png)

## [explanation] How the program works

- **Steps 1 to 4:** a 500 × 500 window, a title Text with size 24, then three Circles that share one center, (250, 270), biggest first, each with its own colour.
- **Step 5:** `win.getMouse()` returns the click as a Point.
- **Step 6:** a small yellow Circle is drawn with the click Point as its center.
- **Step 7:** `getX()` and `getY()` read the coordinates. `int()` turns them into whole numbers, because graphics.py stores them as decimals and `str(310.0)` would show `310.0`. `str()` turns each number into text so `+` can join everything into one message, and a Text object shows it near the bottom.
- The last `getMouse()` keeps the window open until one more click.

Every line uses only objects and methods from this lecture and the ones before it.

## [common_mistakes] Common mistakes

- **Ignoring what getMouse() returns.** `win.getMouse()` on its own waits for a click but throws the Point away. Store it: `click = win.getMouse()`.
- **Joining numbers to text without str().** `"Clicked at " + x` is a `TypeError`. Write `"Clicked at " + str(x)`.
- **Drawing the small circles first.** The big red circle, drawn last, would cover them. Shapes drawn later appear on top.
- **Looking for print() output in the window.** `print()` writes in the terminal (the Python shell). To show text in the window, use a Text object.

## [key_takeaways] Key takeaways

- `win.getMouse()` waits for a click and **returns a Point** at the click position.
- `click.getX()` and `click.getY()` read the click's coordinates.
- The click Point can be used directly as a shape's position, as in `Circle(click, 30)`.
- Interactive programs follow the same pattern: draw, wait for a click, react, and keep the window open until the user is done.
