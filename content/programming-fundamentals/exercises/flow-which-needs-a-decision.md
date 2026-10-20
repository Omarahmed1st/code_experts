---
slug: flow-which-needs-a-decision
type: mcq
title: Which flowchart needs a diamond?
lesson: flowcharts
difficulty: easy
updated: 2026-10-10
---

## Question

You draw a flowchart for each problem below. Which flowchart **needs a diamond** (a decision)?

## Options

- [ ] Read the length and width of a rectangle, and print its area.
  One straight path: input, calculate, output. Every step runs once, so there is no decision.
- [ ] Read three numbers, and print their average.
  One straight path again: read, add, divide, print. Nothing is checked.
- [x] Read a mark, and print "Pass" if it is at least 50, otherwise print "Fail".
  Right: the algorithm must check a condition (is the mark at least 50?) and choose one of two paths.
- [ ] Read a number of minutes, and print it as hours and minutes.
  This uses `/` and `%`, but both calculations always run. There is still only one path.

## Hints

- A diamond asks a question with a YES or NO answer. Which problem has to ask a question?
- In which problem can the output be one of two different things?

## Explanation

A straight-line algorithm runs every step once, top to bottom: input, calculation, output. The area, the average and the minutes-to-hours problems are all like that, so their flowcharts need only parallelograms and rectangles between Start and End.

The Pass/Fail problem is different. After reading the mark, it must check a condition, "is the mark at least 50?", and then follow **one of two paths**. That check is a decision, and a decision is drawn as a diamond with a YES exit and a NO exit.
