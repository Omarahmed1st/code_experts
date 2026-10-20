---
slug: drawing-shapes
title: Drawing shapes
topic: python-graphics
lecture: 3
difficulty: easy
description: Draw points, lines, circles, rectangles, ovals, polygons and text in a graphics.py window, and see how bigger shapes are built from Point objects.
objectives:
  - Create a Point and draw it in a window
  - Build a Line, a Circle and a Rectangle from Point objects
  - Work out a rectangle's width and height from its corners
  - Use Oval, Polygon and Text
prerequisites:
  - "Graphics: windows and coordinates"
related:
  - graphics-windows-and-coordinates
  - colors-moving-and-text
updated: 2026-10-15
---

## [explanation] Every shape follows the same pattern

Drawing anything with graphics.py takes two steps:

1. **Create** the shape object, giving it the positions and sizes it needs.
2. **Draw** it in a window with its `draw()` method: `shape.draw(win)`.

A shape you create but never draw stays invisible. All the programs in this lecture are complete: copy one into a file next to `graphics.py`, run it, and click the window to close it.

## [code] The Point object

`Point(x, y)` creates a Point object. The first number is **x**, how far to the right of the left edge; the second is **y**, how far down from the top. `p.draw(win)` displays it in the window `win`.

```python program
from graphics import *

win = GraphWin("Point", 500, 400)
p = Point(100, 150)
p.draw(win)
win.getMouse()
win.close()
```

```notes
4 | 100 | x: how far right | circle sky
4 | 150 | y: how far down | square yel
5 | draw(win) | show it in win | diamond green
```

## [diagram] One point at (100, 150)

![A 500 by 400 window titled Point. A small black dot sits 100 pixels from the left and 150 pixels from the top, labelled (100, 150), with dashed guide lines to the top and left edges](images/py-point.png)

On a real screen a Point is a **single pixel**, very hard to see. It is drawn bigger here, and the dashed lines and label were added to the picture to show where it is. That is why Points are mostly used to describe **positions** for other shapes, as in the rest of this lecture.

## [code] Drawing several points

Each Point is a separate object with its own name and its own coordinates, and each one needs its own `draw` call.

```python program
from graphics import *

win = GraphWin("Three Points", 500, 400)
p1 = Point(100, 100)
p2 = Point(200, 150)
p3 = Point(300, 250)
p1.draw(win)
p2.draw(win)
p3.draw(win)
win.getMouse()
win.close()
```

```notes
4 | p1 | its own object | circle sky
7 | p1.draw(win) | one draw per Point | square yel
```

## [diagram] The three points

![A 500 by 400 window with three dots labelled p1 (100, 100), p2 (200, 150) and p3 (300, 250), going down and to the right from the top-left area](images/py-points.png)

Which point is closest to the top-left corner, (0, 0)? **p1**, because both of its numbers are the smallest. Change `p3` to `Point(450, 350)` and it moves near the bottom-right corner; `p1` and `p2` stay where they are, because each object is independent.

## [code] Drawing a line

`Line(point1, point2)` builds one object from two others: a Line needs two Point objects, **where it starts** and **where it ends**.

```python program
from graphics import *

win = GraphWin("Line", 500, 400)
p1 = Point(100, 100)
p2 = Point(300, 200)
line = Line(p1, p2)
line.draw(win)
win.getMouse()
win.close()
```

```notes
6 | Line(p1, p2) | Point + Point = Line | circle sky
7 | line.draw | only the line is drawn | square yel
```

## [diagram] A line from (100, 100) to (300, 200)

![A 500 by 400 window with a thin black line going down and to the right, from (100, 100) to (300, 200); both ends are labelled](images/py-line.png)

The two Points only give the line its position. They are not drawn themselves; the labels at the ends were added to the picture. To draw a horizontal line across the whole window, you would write `Line(Point(0, 200), Point(500, 200))`.

## [code] Drawing a circle

`Circle(center, radius)` needs a **center**, which is a Point object, and a **radius**, a number of pixels from the center to the edge.

```python program
from graphics import *

win = GraphWin("Circle", 500, 400)
center = Point(250, 200)
circle = Circle(center, 80)
circle.draw(win)
win.getMouse()
win.close()
```

```notes
4 | Point(250, 200) | the middle | circle sky
5 | 80 | radius in pixels | square yel
```

## [diagram] A circle with radius 80

![A 500 by 400 window with a black circle outline in the centre. A dashed line from the centre point (250, 200) to the right edge of the circle is labelled radius = 80](images/py-circle.png)

The circle is **160 pixels wide**, because its width is two radii. To make it bigger, change the **radius**; to move it, change the **center** Point.

## [code] Drawing a rectangle

`Rectangle(point1, point2)` is defined by **two opposite corners**, both Point objects. Here Point 1 is the top-left corner and Point 2 is the bottom-right corner. The Points are created right inside the `Rectangle(...)` call, which is the same as creating them in variables first.

```python program
from graphics import *

win = GraphWin("Rectangle", 500, 400)
rect = Rectangle(
    Point(100, 100),
    Point(300, 250)
)
rect.draw(win)
win.getMouse()
win.close()
```

```notes
5 | Point(100, 100) | Point 1: top-left | circle sky
6 | Point(300, 250) | Point 2: bottom-right | square yel
```

## [diagram] A 200 × 150 rectangle

![A 500 by 400 window with a black rectangle outline. Its top-left corner is labelled (100, 100) and its bottom-right corner (300, 250); its size is marked as 200 wide by 150 tall](images/py-rectangle.png)

The size comes from subtraction: **width = 300 − 100 = 200** and **height = 250 − 100 = 150**. What would `Rectangle(Point(0, 0), Point(500, 400))` draw? A rectangle covering the whole window.

## [explanation] More graphical objects

Four more shapes complete the set. Each one is drawn the same way, with `name.draw(win)`:

| Object | How it is defined | Example |
|---|---|---|
| `Oval` | fits inside an invisible box set by **2 opposite corners** | `Oval(Point(100, 100), Point(300, 200))` |
| `Polygon` | joins **3 or more points** in order, and closes the shape | `Polygon(Point(250, 50), Point(150, 250), Point(350, 250))` |
| `Line` | joins **exactly 2 points** | `Line(Point(50, 50), Point(250, 150))` |
| `Text` | words **centered on a point** | `Text(Point(250, 50), "Hi!")` |

Three Points in a Polygon make a triangle; four can make any four-sided shape.

## [code] Four shapes in one window

The program draws all four in one window, with positions chosen so they don't overlap.

```python program
from graphics import *

win = GraphWin("More Shapes", 500, 400)

oval = Oval(Point(40, 60), Point(240, 160))
oval.draw(win)

triangle = Polygon(Point(380, 40), Point(290, 180), Point(470, 180))
triangle.draw(win)

line = Line(Point(40, 250), Point(240, 350))
line.draw(win)

label = Text(Point(380, 300), "Hi!")
label.draw(win)

win.getMouse()
win.close()
```

```notes
5 | Oval | 2 corners of a box | circle sky
8 | Polygon | 3 points: a triangle | square yel
11 | Line | exactly 2 points | diamond green
14 | Text | centered on the Point | tri coral
```

## [diagram] Oval, polygon, line and text

![A 500 by 400 window with four shapes: a black oval outline at the top left, a triangle outline at the top right, a diagonal line at the bottom left and the word Hi! at the bottom right](images/py-more-shapes.png)

## [note] Check yourself

::: check Which number would you change to make a circle bigger? And which object would you change to move it?
???
Change the **radius** to make it bigger, and the **center Point** to move it.
:::

::: check How wide and how tall is `Rectangle(Point(50, 80), Point(250, 130))`?
???
**200 wide** (250 − 50) and **50 tall** (130 − 80).
:::

## [common_mistakes] Common mistakes

- **Creating a shape but not drawing it.** Nothing appears until you call `shape.draw(win)`.
- **Giving numbers where Points are needed.** `Line(100, 100, 300, 200)` is an error: a Line takes **two Point objects**, `Line(Point(100, 100), Point(300, 200))`.
- **Using a diameter as the radius.** `Circle(center, 160)` is 320 pixels wide. The radius is half the width.
- **Drawing the same object twice.** Calling `rect.draw(win)` a second time stops with `GraphicsError: Object currently drawn`. Each object is drawn once; create another object for a second copy.

## [key_takeaways] Key takeaways

- Create a shape object, then show it with `shape.draw(win)`.
- `Point(x, y)` is a position; Points are used to build the other shapes.
- `Line` takes 2 Points, `Circle` a center Point and a radius, and `Rectangle` and `Oval` 2 opposite corners.
- `Polygon` joins 3 or more Points; `Text` shows a String centered on a Point.
