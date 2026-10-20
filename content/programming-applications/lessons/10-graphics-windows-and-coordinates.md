---
slug: graphics-windows-and-coordinates
title: "Graphics: windows and coordinates"
topic: python-graphics
lecture: 3
difficulty: easy
description: Use Zelle's graphics library to open a window from Python, understand the window as an object with its own methods, and find any position in it with x and y coordinates.
objectives:
  - Explain what computer graphics are, with examples
  - Set up graphics.py and import it with from graphics import *
  - Open a window with GraphWin, keep it open with getMouse() and close it
  - Find a position in the window from its x and y coordinates
prerequisites:
  - Objects and methods
related:
  - objects-and-methods
  - drawing-shapes
updated: 2026-10-15
---

## [explanation] What are computer graphics?

**Computer graphics** means using programs to create visual elements on the screen: shapes, text, buttons, diagrams, games, simulations and user interfaces. Every app window you have ever used was drawn by a program.

Here is what happens when one of our graphics programs runs:

1. You write **code**, for example `circle.draw(win)`.
2. A **graphics library** does the hard work of talking to the screen.
3. A **window** opens.
4. **Shapes** appear in it.

The key idea for this course: **every shape you draw is an object**, just like a String or a List. It has data (its position, its size, its colour) and methods (draw it, move it, colour it).

## [explanation] Our graphics library: graphics.py

We use **graphics.py**, a small library written by John Zelle for teaching programming. It is a single Python file. It is not built into Python, so it has to be set up once:

- **Keep `graphics.py` in the same folder as your program.** Your teacher gives you the file, or you can download it from its author's website.
- It draws with **Tkinter**, which comes with the standard Python installer on Windows and macOS. On some Linux systems Tkinter is a separate package (for example `python3-tk`).

The first line of every graphics program loads the library:

```python
from graphics import *
```

`graphics` is the name of the file (without `.py`), and `import *` brings in **everything** it provides:

| Name | Creates |
|---|---|
| `GraphWin` | windows |
| `Point` | positions |
| `Line`, `Circle`, `Rectangle`, `Oval`, `Polygon` | shapes |
| `Text` | words in the window |

All of these are **classes** that someone else wrote. Today we only **use** them to make objects; building our own classes comes later in the course.

::: warning These programs run on your computer, not in the browser
The Run button on this site runs Python in your browser, which has no windows to open. So the graphics programs in these lectures have no Run button: copy them into a file next to `graphics.py` and run them with Python on your computer. The pictures show what the window looks like.
:::

## [code] Our first graphics window

```python program
from graphics import *

win = GraphWin("My First Window", 500, 400)
win.getMouse()
win.close()
```

```notes
1 | import * | 1. load the library | circle sky
3 | GraphWin | 2. title, width, height | square yel
4 | getMouse | 3. wait for a click | diamond green
5 | close | 4. close the window | tri coral
```

## [diagram] The window it opens

![An empty window titled My First Window, 500 pixels wide and 400 pixels tall, with a plain light grey drawing area](images/py-first-window.png)

The program opens an empty window titled **My First Window**, 500 pixels wide and 400 pixels tall, and waits. When you click anywhere inside it, the program closes it. The title bar looks different on Windows, macOS and Linux; the drawing area is the same.

## [explanation] Line by line

1. `from graphics import *` loads the library.
2. `GraphWin("My First Window", 500, 400)` creates a window: its **title**, its **width** (500 pixels) and its **height** (400 pixels).
3. `win.getMouse()` pauses the program until the user clicks inside the window. Without it, the program would reach the last line straight away, and the window would open and close before you could see it.
4. `win.close()` closes the window.

Change the title and the two numbers, run it again, and watch the window change.

## [explanation] The window is an object

```python
win = GraphWin("My Window", 500, 400)
```

`GraphWin(...)` **creates the window object**. `win` is only a **variable**: a name that refers to that object, exactly like `p` referred to a Point object in the last lecture.

Because `win` refers to a window object, you can ask it to do things with dot notation:

| Method | What it does |
|---|---|
| `win.getMouse()` | waits for a click inside the window |
| `win.close()` | closes the window |

If you wrote `w2 = GraphWin("Second", 300, 300)` as well, you would have **two separate window objects**, each with its own name, size and shapes.

## [explanation] The coordinate system

Every position in the window is a pair of numbers, **(x, y)**:

- **(0, 0) is the top-left corner** of the window.
- **x grows to the right**: it says how far from the left edge.
- **y grows downward**: it says how far from the top edge. This is the opposite of a maths graph, where y grows upward, so it surprises almost everyone at first.

For a 500 × 400 window, the four corners are (0, 0), (500, 0), (0, 400) and (500, 400).

## [diagram] Coordinates in a 500 × 400 window

![A 500 by 400 window with a grid every 50 pixels. The corners are labelled (0, 0) at the top left, (500, 0) at the top right, (0, 400) at the bottom left and (500, 400) at the bottom right. An arrow along the top shows x growing to the right and an arrow down the left side shows y growing downward. A dot marks the centre at (250, 200)](images/py-coordinates.png)

Each grid square is 50 × 50 pixels. The dot in the middle is **Point(250, 200)**: half of 500 across and half of 400 down, the exact centre of the window.

Strictly, the pixels are numbered 0 to 499 across and 0 to 399 down, so (500, 400) is the outer edge of the window rather than a pixel inside it.

## [note] Check yourself

::: check Where is Point(250, 200) in a 500 × 400 window?
???
In the exact **centre**: 250 is half of the width and 200 is half of the height.
:::

::: check In a 500 × 400 window, which point is nearer the bottom: (100, 350) or (400, 50)?
???
**(100, 350)**. y grows downward, so the larger y, 350, is nearer the bottom. (400, 50) is near the top-right corner.
:::

## [common_mistakes] Common mistakes

- **graphics.py in the wrong folder.** If Python can't find the file, the first line stops with `ModuleNotFoundError: No module named 'graphics'`. Put `graphics.py` next to your program.
- **Naming your own file graphics.py.** Then `from graphics import *` imports *your* file instead of the library. Call your program something else, such as `my_window.py`.
- **No getMouse() before close().** The window flashes open and shut. Wait for a click before closing.
- **Thinking y grows upward.** In the window, a larger y is **lower** on the screen.
- **Swapping width and height.** `GraphWin("Tall", 300, 500)` is 300 wide and 500 tall: width comes first.

## [key_takeaways] Key takeaways

- Graphics programs draw visual elements; with graphics.py, every window and shape is an object.
- Keep `graphics.py` next to your program and start with `from graphics import *`.
- `GraphWin(title, width, height)` creates a window object; `win.getMouse()` waits for a click and `win.close()` closes it.
- (0, 0) is the top-left corner; x grows to the right and **y grows downward**.
