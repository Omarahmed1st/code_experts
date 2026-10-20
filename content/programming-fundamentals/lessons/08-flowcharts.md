---
slug: flowcharts
title: "Flowcharts: one problem, three representations"
topic: flowcharts
lecture: 3
difficulty: easy
description: Draw an algorithm as a flowchart, match every shape to a plain step and a pseudocode line, and write the rectangle-area program in C++ from the plan.
objectives:
  - Use the right flowchart symbol for each kind of step
  - Match plain steps, flowchart shapes and pseudocode lines one to one
  - Tell a straight-line algorithm from one with a decision
  - Turn a flowchart into a C++ program
prerequisites:
  - "Pseudocode: planning before code"
  - "Operators: calculate, store and compare"
related:
  - algorithms-steps-flowcharts-pseudocode
  - decisions-if-then-else
updated: 2026-10-09
---

## [explanation] From problem to solution

Every problem in this course goes through the same path. First we **analyze** it, then we **represent** the solution:

1. **Analyze:** understand the problem, then identify its **input**, **processing** and **output**.
2. **Represent:** write the **steps**, draw the **flowchart**, write the **pseudocode**.

This lecture practises both stages on bigger problems.

## [diagram] The flowchart symbols

Keep this legend in mind while you read the charts in this lecture.

![A legend of flowchart symbols on a navy background: a green oval labelled Start for start and end, a blue parallelogram labelled Input T for input or output, a white rectangle labelled area ← l * w for a process, a yellow diamond labelled T > 30? for a decision with YES and NO exits, and an arrow for the order of the steps](images/flowchart-symbols.png)

## [example] Worked example: the area of a rectangle

**Problem:** calculate the area of a rectangle, given its length and width.

| Question | Answer |
|---|---|
| What are the inputs? | Length, Width |
| What is the processing? | Area = Length × Width |
| What is the output? | Area |

**Example:** Length = 8 and Width = 5, so Area = 8 × 5 = 40.

## [diagram] Rectangle area as a flowchart

Input and output use the **parallelogram**; the calculation uses the **rectangle**.

![A flowchart: Start, the parallelogram Input Length, Width, the rectangle Area = Length × Width, the parallelogram Print Area, then End](images/rectangle-area.png)

## [explanation] Three representations, matched line by line

Each numbered step is one flowchart shape and one pseudocode line. Same algorithm, different representations.

| Step | Flowchart shape | Pseudocode |
|---|---|---|
| 1. Start | oval: Start | `BEGIN` |
| 2. Read Length | parallelogram: Input Length, Width | `INPUT length` |
| 3. Read Width | (same parallelogram) | `INPUT width` |
| 4. Calculate Area = Length × Width | rectangle | `area ← length * width` |
| 5. Print Area | parallelogram | `PRINT area` |
| 6. End | oval: End | `END` |

## [code] From the flowchart to C++

Now the same plan as a complete C++ program. Lengths can have decimals, so all three variables are `float`. The user typed `2.5` and `4`.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    float length, width, area;
    cout << "Enter length: ";
    cin >> length;
    cout << "Enter width: ";
    cin >> width;
    area = length * width;
    cout << "Area = " << area << endl;
    return 0;
}
```

```input
2.5
4
```

```output
Enter length: 2.5
Enter width: 4
Area = 10
```

```notes
6 | float | decimals allowed | circle sky
8 | cin >> length; | Input Length | square sky
11 | area = length * width; | the rectangle shape | diamond yel
12 | cout | Print Area | tri green
```

## [explanation] From simple to more complex

So far every algorithm ran in **one straight path**: input, calculation, output. Every step ran once, top to bottom.

Real problems often need a **decision**: the algorithm checks a condition and chooses one of **two possible paths**.

| So far: simple | Now: more complex |
|---|---|
| Input → Calculation → Output | Input → Calculation → **Decision** → Output A **or** Output B |
| one straight path | two possible paths |

In a flowchart the decision is the **diamond**. It always has exactly two exits, YES and NO. The next lecture is all about decisions.

## [common_mistakes] Flowchart mistakes to avoid

- **The wrong shape.** Reading or printing a value goes in a parallelogram, not a rectangle. Rectangles are for calculations.
- **A decision with one exit.** Every diamond has exactly two exits, labelled YES and NO (or TRUE and FALSE).
- **Paths that never meet again.** After a decision, the two paths should join before End, so the chart has one End.
- **Missing arrows.** Without arrows the reader can't tell the order of the steps.

## [note] Check yourself

::: check Draw (on paper) the flowchart for: read a price and a quantity, and print the total cost.
???
Start → parallelogram `Input price, quantity` → rectangle `total ← price * quantity` → parallelogram `Print total` → End. One straight path, no decision.
:::

## [key_takeaways] Key takeaways

- Analyze first (input, processing, output), then represent: steps, flowchart, pseudocode.
- Each step is one flowchart shape and one pseudocode line.
- Input and output: parallelogram. Calculation: rectangle. Decision: diamond with two exits.
- A decision turns one straight path into two possible paths.
