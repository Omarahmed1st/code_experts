---
slug: what-is-programming-and-why-python
title: What is programming, and why Python?
topic: python-introduction
lecture: 1
difficulty: easy
description: A program is a list of instructions that turns a problem into a result. See why Python is a good language to write them in, how Python runs your code line by line, and write your first program.
objectives:
  - Say what programming is in one sentence
  - Give reasons why Python is popular, and fields where it is used
  - Explain what the Python interpreter does with your program
  - Write and run a program that prints text with print()
prerequisites:
  - None. This is the first lecture of the course.
related:
  - variables-and-data-types
  - input-processing-and-output
updated: 2026-10-15
---

## [explanation] Programming is giving instructions

**Programming** means giving a computer instructions so that it can perform a task or solve a problem. The computer follows those instructions exactly, one after another. It never guesses what you meant.

Every program follows the same path:

**Problem → Program → Computer → Result**

You start with a problem ("what is the average of these marks?"), write a program that solves it, the computer runs the program, and you get a result ("87.67").

You use programs like this every day:

- a **calculator** turns the numbers you press into an answer;
- a **temperature monitor** reads a sensor and switches a fan on when it gets too hot;
- a **website** turns a click into a new page;
- an **automated system**, such as a factory line or a traffic light, repeats its steps all day without a person.

## [explanation] Why Python?

There are hundreds of programming languages. Python is one of the most popular, especially for beginners and for engineers, for six reasons:

| Advantage | What it means for you |
|---|---|
| Simple syntax | The code reads almost like English, with few symbols to remember. |
| Fewer lines of code | The same task usually needs fewer lines than in C++ or Java. |
| Easy debugging | Error messages name the line and the kind of mistake. |
| Large library ecosystem | Ready-made code exists for maths, data, images, AI, websites and much more. |
| Cross-platform | The same program runs on Windows, macOS and Linux. |
| Beginner friendly | You can write a useful program in your first hour. |

The idea behind all six: **Python lets you focus on solving the problem, not on complicated syntax.**

## [example] One line instead of six

Here is the classic first program, which only prints a greeting. In C++ it takes six lines:

```cpp
#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

In Python it takes one:

```python
print("Hello, World!")
```

Both programs print the same line. Python needs no `main()`, no semicolons and no `#include`: you write the instruction itself.

## [explanation] Where is Python used?

| Field | An example |
|---|---|
| Web development | the server side of websites and apps |
| Data analysis | reading a spreadsheet of results and finding trends |
| Artificial intelligence | programs that answer questions or recognise speech |
| Machine learning | a model that learns to predict a price from past data |
| Automation | renaming a thousand files or sending reports every morning |
| Science | simulations and calculations in physics, chemistry and biology |
| Engineering | reading sensors, controlling devices, processing signals |
| Security | scanning a network for weak passwords or open ports |

Later in this course you will use Python for graphics, and the Computer Vision course on this site uses Python to work with images.

## [explanation] How Python runs your program

You write a Python program as plain text, saved in a file that ends in `.py`. A program called the **Python interpreter** then runs it:

**Python code → Python interpreter → the computer executes it → output**

The interpreter works in two steps:

1. It reads the whole file and checks the **grammar** (the syntax). A missing bracket or quote stops everything before any line runs.
2. It then **executes the program line by line**, from the top down. Each line finishes before the next one starts.

Because of step 2, a mistake in the middle of a program only shows up when Python reaches it, and the lines above it have already done their work. The example below shows exactly that.

## [example] An error stops the program at that line

Press **Run**. Lines 1 and 2 print, then Python reaches line 3, which uses a name it has never seen, and stops with a `NameError`. Line 4 never runs.

```python program run
print("Line 1 runs")
print("Line 2 runs")
print(score)
print("Line 4 never runs")
```

```notes
3 | score | never created: NameError | tri coral
4 | print | never reached | square sky
```

## [code] Your first Python program

`print()` displays information on the screen. Whatever you put between the brackets is shown. Text goes inside quotes.

```python program run
print("Hello, World!")
```

```output
Hello, World!
```

```notes
1 | print | shows it on the screen | circle sky
1 | "Hello, World!" | the text to display | square yel
```

## [explanation] Reading the print line

`print("Hello, World!")` has three parts:

- `print` is the name of a **function**: a ready-made instruction that Python already knows.
- The **brackets** `( )` hold what you give the function to work with.
- `"Hello, World!"` is a piece of **text**. The quotes tell Python where the text starts and ends. The quotes themselves are not printed.

Each `print()` starts a new line. You can also give `print()` several things separated by commas: it prints them on one line with a space between them.

Lines that start with `#` are **comments**. Python skips them. Programmers use them to explain the code to people.

## [code] Several lines, and a comment

```python program run
# My first program prints three lines
print("Hello, Python!")
print("Welcome to Programming Applications")
print("Python", "is", "fun")
```

```output
Hello, Python!
Welcome to Programming Applications
Python is fun
```

```notes
1 | # | a comment: Python skips it | circle green
4 | , | commas: a space between | square sky
```

## [note] Check yourself

::: check What does this program print?
```python
print("Ready")
# print("Set")
print("Go", "!")
```
???
```output
Ready
Go !
```
The second line is a comment, so it never runs. The comma in the last line puts a space between `Go` and `!`.
:::

::: check Python finds a mistake on line 5 of a 10-line program. Which lines have already run?
???
If the mistake is a grammar mistake (a missing bracket or quote), **none**: Python checks the grammar of the whole file before running anything. Any other mistake (like using a name that doesn't exist) is found while running, so lines 1 to 4 have already run.
:::

## [common_mistakes] Common mistakes

- **Forgetting the quotes.** `print(Hello)` makes Python look for something called `Hello`, and stops with `NameError`. Text always goes in quotes: `print("Hello")`.
- **Capital letters.** Python is case-sensitive: `Print("Hi")` is a `NameError`. The function is `print`, all small letters.
- **Missing a bracket.** `print("Hi"` is a grammar mistake (`SyntaxError`), so nothing in the file runs.
- **Curly quotes.** Code copied from Word or PowerPoint may use “curly” quotes, which Python doesn't accept. Type straight quotes `"` in your editor.
- **Spaces at the start of a line.** In Python the start of a line matters. `   print("Hi")` with spaces in front, on its own, is an `IndentationError`.

## [key_takeaways] Key takeaways

- Programming is giving a computer exact instructions: **problem → program → computer → result**.
- Python is popular because its code is short and readable, and it has libraries for almost everything.
- The interpreter checks the whole file's grammar, then runs the program **line by line**, from the top.
- `print()` shows text on the screen; text goes in quotes, and commas put spaces between items.
- `#` starts a comment, which Python ignores.
