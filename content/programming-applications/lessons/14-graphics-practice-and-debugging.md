---
slug: graphics-practice-and-debugging
title: "Graphics practice: traffic light, house and bug hunt"
topic: python-graphics
lecture: 3
difficulty: medium
description: Plan and draw a traffic light, design your own house picture, and learn the five most common graphics mistakes by finding four bugs in a short program. Ends with a summary of objects and methods.
objectives:
  - Plan a picture's coordinates before writing code
  - Draw a complete picture from rectangles, circles, polygons, lines and text
  - Find and fix the five most common graphics.py mistakes
  - Name each graphics object and the methods it can perform
prerequisites:
  - Mouse clicks and an interactive target
related:
  - mouse-clicks
  - drawing-shapes
updated: 2026-10-15
---

## [explanation] Mini practice: a traffic light

Your turn: draw a simple traffic light with

- **1 Rectangle** for the black body, and
- **3 Circles** for the red, yellow and green lights.

You decide every number yourself: the window size, the rectangle's two corners, the three circle centers, the radius and the colours. **Sketch it on squared paper first**, with each square 50 × 50 pixels. Check that every object is drawn and that the circles fit inside the rectangle. Then compare with the solution below; a picture with different numbers is just as right if it works.

## [code] Traffic light: one possible solution

```python program
from graphics import *

win = GraphWin("Traffic Light", 300, 500)

body = Rectangle(Point(75, 50), Point(225, 450))
body.setFill("black")
body.draw(win)

red = Circle(Point(150, 140), 50)
red.setFill("red")
red.draw(win)

yellow = Circle(Point(150, 250), 50)
yellow.setFill("yellow")
yellow.draw(win)

green = Circle(Point(150, 360), 50)
green.setFill("green")
green.draw(win)

win.getMouse()
win.close()
```

```notes
3 | 300, 500 | a tall window | circle sky
5 | Rectangle | the body, drawn first | square yel
9 | 150 | x = 150 for every light | diamond green
9 | 50) | the same radius, 50 | tri coral
```

## [diagram] The traffic light

![A tall window, 300 by 500, titled Traffic Light. A black rectangle runs from (75, 50) to (225, 450). Inside it are three circles of radius 50, one above the other: red at (150, 140), yellow at (150, 250) and green at (150, 360)](images/py-traffic-light.png)

## [explanation] Reading the solution

The program is one pattern repeated four times: **create the object, set its colour, draw it**.

| Object | Kind | Position |
|---|---|---|
| body | Rectangle | from (75, 50) to (225, 450) |
| red | Circle | center (150, 140), radius 50 |
| yellow | Circle | center (150, 250), radius 50 |
| green | Circle | center (150, 360), radius 50 |

Why do all three circles use **x = 150**? Because 150 is halfway between 75 and 225, the left and right sides of the body, so every light sits in the middle of it.

**Order matters:** the body is drawn first. If it were drawn last, the black rectangle would cover the lights.

## [explanation] Mini project: draw a house

This time there is no solution code, on purpose: design it yourself. Draw a house in a 500 × 400 window titled **My House**, using:

| Object | Draws the… |
|---|---|
| Rectangle | house body |
| Polygon | roof |
| Rectangle | door |
| Rectangles | windows |
| Circle | sun |
| Text | title |
| Line | ground |

Use Points for every position, and colours for everything. Plan the coordinates on paper first, and draw **back to front**: the body and roof before the door and windows, so they appear on top.

**Bonus:** move the sun across the sky with `sun.move(-50, 0)`.

## [diagram] One possible house

![A 500 by 400 window titled My House: a light-blue sky, green grass under a dark ground line, a brown house body with a red triangular roof, a dark brown door and two white windows, a yellow sun at the top right and the bold title My House at the top left](images/py-house.png)

This is one possible answer. Yours can look completely different: other colours, a bigger house, two suns. What matters is that every part of the picture is an object you created and drew.

## [explanation] Debugging graphics programs

Five mistakes cause most broken graphics programs. When something goes wrong, check them in order:

| Common mistake | What to check |
|---|---|
| 1. An object is created but not drawn | every shape calls `.draw(win)` |
| 2. Coordinates outside the window | x between 0 and the width, y between 0 and the height |
| 3. `close()` called too early | `win.close()` is the last line |
| 4. Wrong Point coordinates | x comes first; y grows downward |
| 5. The import is missing | line 1 is `from graphics import *` |

## [explanation] Bug hunt

This program should show a yellow sun. It has **four bugs**. Use the checklist above to find them before you open the answer.

```python
win = GraphWin("Bug Hunt", 400, 300)
sun = Circle(Point(600, 100), 40)
sun.setFill("yellow")
win.close()
sun.draw(win)
```

::: check Which four bugs did you find?
???
1. **The import is missing.** Without `from graphics import *` on line 1, the program stops at once with `NameError: name 'GraphWin' is not defined`.
2. **The sun is outside the window.** Its center x is 600, but the window is only 400 wide.
3. **`close()` comes before `draw()`.** Drawing on a closed window raises `GraphicsError: Can't draw to closed window`.
4. **There is no `win.getMouse()` before `close()`.** Even with the other bugs fixed, the window would vanish instantly.

The fixed order is: import, create the window, create and colour the sun, draw it, wait for a click, close.
:::

## [code] The fixed program

```python program
from graphics import *

win = GraphWin("Bug Hunt", 400, 300)
sun = Circle(Point(200, 100), 40)
sun.setFill("yellow")
sun.draw(win)
win.getMouse()
win.close()
```

```notes
1 | from graphics import * | bug 1: the import | circle sky
4 | 200 | bug 2: inside the window | square yel
6 | draw | bug 3: draw before close | diamond green
7 | getMouse | bug 4: wait for a click | tri coral
```

## [diagram] The yellow sun

![A 400 by 300 window titled Bug Hunt with a yellow circle of radius 40 centred at (200, 100)](images/py-sun.png)

## [explanation] Objects and their methods

Here is everything from this lecture in one table. **Objects** are the things; **methods** are the actions those things can perform, always written after a dot.

| Object | Its methods |
|---|---|
| `win` (a GraphWin) | `.getMouse()`, `.close()` |
| `circle` | `.draw()`, `.move()`, `.setFill()`, `.setOutline()` |
| `rectangle` | `.draw()`, `.move()`, `.setFill()`, `.setOutline()` |
| `text` | `.draw()`, `.move()`, `.setSize()`, `.setTextColor()` |
| `click` (a Point) | `.getX()`, `.getY()` |

Read `circle.move(50, 0)` aloud: the **thing** is `circle`, the **action** is `move`.

## [explanation] Coming next: classes

In these lectures you **used** objects that someone else designed: `GraphWin`, `Point`, `Circle`, `Text`. Next, you will learn **classes**, which let you design **your own** kinds of objects, with their own data and their own methods.

A question to think about until then: what if you wanted a `TrafficLight` object, with a method called `change()` that switches the light from red to green?

## [common_mistakes] Common mistakes

- **Drawing back to front the wrong way round.** Shapes drawn later cover earlier ones. Draw large background shapes first.
- **Guessing coordinates.** Sketch the picture on squared paper first; guessing numbers and re-running wastes time.
- **Copying the same object.** To draw three lights, create three Circle objects; one object can only be drawn once.
- **Fixing one bug and stopping.** A program can have several bugs, as the bug hunt shows. Run the checklist to the end.

## [key_takeaways] Key takeaways

- Plan coordinates before coding, and draw back to front.
- A picture is many objects, each following the same pattern: create, colour, draw.
- When a graphics program fails, check: drawn? inside the window? `close()` last? x before y? import present?
- Objects are the things (windows, shapes, text, points); methods are the actions they perform.
