---
slug: cvr-pip-vs-import
type: mcq
title: Where does each line go?
lesson: reading-and-showing-images
difficulty: easy
updated: 2026-10-16
---

## Question

Which statement about `pip install opencv-python` and `import cv2` is right?

## Options

- [x] `pip install` is typed once, in a terminal; `import cv2` goes at the top of every Python file that uses OpenCV.
  Right: pip downloads and installs the library once. Each program then has to import it.
- [ ] Both lines go at the top of every Python file.
  `pip install opencv-python` is not Python code. Inside a .py file it is a `SyntaxError`.
- [ ] `import cv2` is typed once, in a terminal, and then every file can use `cv2`.
  Each Python file starts fresh, so each one needs its own `import cv2`.
- [ ] `pip install cv2` and `import opencv-python` are the correct pair.
  The names are the other way round: you install `opencv-python` and import `cv2`.

## Explanation

Installing and importing are two different jobs. **Installing** puts the library on your computer: one command in a terminal (Command Prompt on Windows), once. **Importing** makes it available inside one program: `import cv2` at the top of every file that calls OpenCV functions.
