---
slug: solve-tea-decision-step
type: mcq
title: The decision in the tea algorithm
lesson: from-problem-to-program
difficulty: medium
updated: 2026-10-10
---

## Question

Here is the tea algorithm from the lecture:

1. Start.
2. Fill the kettle with water.
3. Switch the kettle on and wait until the water boils.
4. Put a tea bag in a cup.
5. Pour the hot water into the cup.
6. Wait 3 minutes, then take the tea bag out.
7. If you want sugar, add it and stir.
8. End.

Which step is a **decision**?

## Options

- [ ] Step 3, because you have to wait.
  Waiting is just part of the step. Every time you make tea, the water must boil, so there is no choice here.
- [ ] Step 5, because it must come after step 3.
  The order matters here (you can't pour before the water boils), but the step itself always happens.
- [x] Step 7, because it only happens when the answer to "Do you want sugar?" is yes.
  Right: a decision asks a yes/no question, and the step runs only on one answer.
- [ ] Step 1, because it decides when the algorithm starts.
  "Start" only marks the beginning. It asks no question.

## Hints

- A decision asks a question that has a yes or no answer.
- Which step does **not** happen every time you make tea?

## Explanation

In an algorithm, most steps happen every time, in order. A **decision** is different: it asks a question, and the step only happens when the answer is yes.

Step 7 asks "Do you want sugar?". If yes, you add sugar and stir; if no, you skip it. All the other steps always happen. Programs work the same way, and later you will write decisions with `IF … THEN … ELSE`.
