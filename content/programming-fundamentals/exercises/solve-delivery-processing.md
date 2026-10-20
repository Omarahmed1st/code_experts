---
slug: solve-delivery-processing
type: mcq
title: Input, processing and output for free delivery
lesson: from-problem-to-program
difficulty: easy
updated: 2026-10-10
---

## Question

**Problem:** an online shop reads the price of an order in pounds. If the price is greater than 500, it prints `Free delivery`. Otherwise, it prints `Delivery costs 30 pounds`.

Which answer correctly names the input, the processing and the output?

## Options

- [x] Input: the price. Processing: compare the price with 500. Output: `Free delivery` or `Delivery costs 30 pounds`.
  Right: the price goes in, the program compares it with 500, and one of the two messages comes out.
- [ ] Input: 500. Processing: compare the price with 500. Output: the price.
  500 is a fixed rule in the problem, not a value the program reads. And the program prints a message, not the price.
- [ ] Input: the price. Processing: add 30 pounds to the price. Output: the new price.
  The problem never asks to add anything. The program only decides which message to print.
- [ ] Input: `Free delivery`. Processing: read the price. Output: 500.
  The parts are mixed up. The messages are what the program prints, so they are the output.

## Hints

- What does the program read? That is the input.
- What does the program show at the end? That is the output. What happens in between?

## Explanation

Finding the input, the processing and the output is always your first move.

- **Input:** the value the program reads, here the price of the order.
- **Processing:** the work done on the input, here comparing the price with 500.
- **Output:** what the program shows, here one of the two messages.

The number 500 is part of the **rule** of the problem. The program does not read it; it uses it in the comparison. This problem has the same shape as the fan example in the lecture: one value in, one comparison, one of two messages out.
