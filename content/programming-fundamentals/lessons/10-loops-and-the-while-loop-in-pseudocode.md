---
slug: loops-and-the-while-loop-in-pseudocode
title: "Repetition: the WHILE loop in pseudocode"
topic: while-loops
lecture: 3
difficulty: easy
description: Repeat steps without copying them. Learn the three parts of every loop, write WHILE loops in pseudocode, trace them iteration by iteration, and see why a missing update never stops.
objectives:
  - Explain why programs need repetition
  - Name the three parts of a loop, initialization, condition and update
  - Write and trace a WHILE loop in pseudocode
  - Count iterations and condition checks
  - Spot the missing update that makes an infinite loop
prerequisites:
  - "Decisions: IF … THEN … ELSE"
related:
  - exam-results-processor
  - while-loops-in-cpp
updated: 2026-10-09
---

## [explanation] What if we need to repeat?

Suppose we want to print HELLO five times. The long way is five lines:

```pseudocode
PRINT "HELLO"
PRINT "HELLO"
PRINT "HELLO"
PRINT "HELLO"
PRINT "HELLO"
```

Five times means five lines. But what if we need it **1000** times? A thousand PRINT lines? And **1,000,000** times?

Copying lines is slow, easy to get wrong, and impossible when we don't know the count in advance. We need **repetition**.

## [explanation] Loops

A **loop** is a structure that repeats a group of instructions until a condition says stop.

Where do we use loops?

- counting from 1 to 10;
- reading many sensor measurements;
- repeating a calculation;
- processing many students;
- blinking an LED again and again.

Why loops?

- **Avoid repetition:** write the instructions only once.
- **Reduce code:** less duplicated logic to write and to fix.
- **Process many values:** students, sensor readings, measurements.
- **Repeat until a condition:** keep going while something is true.

Loops let one algorithm repeat automatically: write the steps once, and the loop runs them as many times as needed.

## [diagram] How does a loop work?

Initialize once, then check, execute, update, and check again. The yellow arrow is the repetition.

![A loop flowchart: the rectangle 1 Initialize (runs once), then the diamond 2 Condition? (checked before every pass). TRUE leads down to Execute the body, then 3 Update (after the body, every time), and a yellow repeat arrow goes back up to the condition. FALSE leads right to the oval Exit loop](images/loop-three-parts.png)

## [explanation] Every loop has three parts

| Part | Job | Example |
|---|---|---|
| **1. Initialization** | give the counter a starting value (runs once) | `counter ← 1` |
| **2. Condition** | decide whether to repeat again (checked before every pass) | `counter <= 5` |
| **3. Update** | change the counter after each pass | `counter ← counter + 1` |

The update moves the counter so that the condition eventually becomes FALSE. That is what lets the loop stop.

## [explanation] The WHILE loop

A **WHILE** loop repeats its instructions **while** a condition is TRUE.

```pseudocode
WHILE condition DO
    statements
END WHILE
```

- `WHILE condition DO`: the condition is checked **before** every pass.
- `statements`: the loop **body**, the lines that repeat.
- `END WHILE`: marks the end of the loop.

If the condition is TRUE, the body runs and the loop goes back to check again. If it is FALSE, the body is skipped and the algorithm continues after `END WHILE`. If the condition is FALSE at the very start, the body runs zero times.

## [code] Count from 1 to 5

A complete WHILE loop. The three parts are marked.

```pseudocode program
BEGIN
    counter ← 1
    WHILE counter <= 5 DO
        PRINT counter
        counter ← counter + 1
    END WHILE
END
```

```output
1
2
3
4
5
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    while (counter <= 5)
    {
        cout << counter << endl;
        counter = counter + 1;
    }
    return 0;
}
```

```notes
2 | counter ← 1 | 1. initialization | circle sky
3 | counter <= 5 | 2. condition | square yel
4 | PRINT counter | the body | tri sky
5 | counter ← counter + 1 | 3. update | diamond green
6 | END WHILE | end of the loop | circle green
```

## [diagram] Count from 1 to 5 as a flowchart

Trace it with your finger: down through the body, then back up along the yellow arrow to the condition. When counter becomes 6, the NO path leads to End. The backward arrow is what creates repetition.

![A flowchart: Start, counter ← 1, then the diamond counter <= 5?. YES leads down to Print counter and counter ← counter + 1, and a yellow repeat arrow goes back up to the diamond. NO leads right to End](images/count-1-to-5.png)

## [explanation] What is an iteration?

One complete run of the loop body is called an **iteration**. A trace table follows the loop one iteration at a time:

| Iteration | counter before | Output | counter after |
|---|---|---|---|
| 1 | 1 | 1 | 2 |
| 2 | 2 | 2 | 3 |
| 3 | 3 | 3 | 4 |
| 4 | 4 | 4 | 5 |
| 5 | 5 | 5 | 6 |

Then `6 <= 5` is FALSE and the loop stops.

Count them: the body runs **5 times** (5 iterations), but the condition is checked **6 times**: 5 × TRUE and 1 × FALSE. The sixth check is the one that stops the loop.

## [code] Sensor monitoring with a loop

A computer engineering example: read the temperature again and again while the system is running. Here a **decision sits inside a loop**: each iteration reads a new temperature and decides the fan state. This loop runs as long as `systemIsOn` is true, which is typical of embedded controllers, so it has no fixed output.

```pseudocode program
BEGIN
    WHILE systemIsOn == true DO
        INPUT temperature
        IF temperature > 30 THEN
            PRINT "Fan ON"
        ELSE
            PRINT "Fan OFF"
        END IF
    END WHILE
END
```

```notes
2 | systemIsOn == true | repeat while the system is ON | square yel
3 | INPUT temperature | a new reading each pass | circle sky
4 | IF temperature > 30 THEN | a decision inside the loop | diamond green
```

## [common_mistakes] The infinite loop

The most common loop mistake. What is missing here? Can the condition ever become FALSE?

```pseudocode program
counter ← 1
WHILE counter <= 5 DO
    PRINT counter
END WHILE
```

```notes
2 | counter <= 5 | always 1 <= 5: TRUE | tri coral
3 | PRINT counter | prints 1 forever | tri coral
```

## [explanation] Why it never stops

The update line `counter ← counter + 1` is missing.

1. `counter` always stays 1.
2. So the condition `1 <= 5` is always TRUE.
3. So the loop never stops: it prints 1 1 1 1 1 1 … forever.

Always check **how** the loop condition will eventually become FALSE.

## [note] Practice challenge 1: print 1 to 10

::: check Write an algorithm that prints the numbers 1 to 10, as plain steps, as a flowchart and as pseudocode. Hint: use a counter and a WHILE loop.
???
**Steps:** 1. Start. 2. Set counter to 1. 3. Check if counter <= 10. 4. Print counter. 5. Increase counter by 1. 6. Repeat from step 3. 7. End when the condition is false.

**Flowchart:** the same as "Count from 1 to 5" above, with the diamond `counter <= 10?`.

**Pseudocode:**
```pseudocode
BEGIN
    counter ← 1
    WHILE counter <= 10 DO
        PRINT counter
        counter ← counter + 1
    END WHILE
END
```
Compared with counting to 5, only the condition changed. Step 6 in the steps is the backward arrow in the flowchart and `END WHILE` in the pseudocode.
:::

## [code] Practice challenge 2: even numbers from 2 to 10

Print all even numbers from 2 to 10. Try it first, then compare with challenge 1: what changed? Here is the answer. Only the **start value** (2) and the **update** (+2 instead of +1) are different. The condition `number <= 10` still makes the loop stop after printing 10.

```pseudocode program
BEGIN
    number ← 2
    WHILE number <= 10 DO
        PRINT number
        number ← number + 2
    END WHILE
END
```

```output
2
4
6
8
10
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int number = 2;
    while (number <= 10)
    {
        cout << number << endl;
        number = number + 2;
    }
    return 0;
}
```

```notes
2 | number ← 2 | start at 2 | circle sky
3 | number <= 10 | stop after 10 | square yel
5 | number + 2 | +2, not +1 | diamond green
```

## [key_takeaways] Key takeaways

- Loops repeat instructions automatically: write the steps once.
- A loop needs initialization, a condition and an update.
- WHILE repeats while the condition is TRUE, and checks it before every pass.
- One run of the body is an iteration. A loop that runs 5 times checks its condition 6 times.
- Every loop must be able to stop. Without the update, the condition never becomes FALSE.
