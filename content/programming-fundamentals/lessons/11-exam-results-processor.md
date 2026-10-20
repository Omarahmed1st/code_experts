---
slug: exam-results-processor
title: "Final challenge: the exam results processor"
topic: while-loops
lecture: 3
difficulty: medium
description: One long problem that uses everything from Lecture 3, with a loop, a decision inside it and a counter. Design it, write the pseudocode, trace it with real marks, then see it in C++.
objectives:
  - Design a solution from input, processing and output to a flowchart
  - Write a WHILE loop with an IF … ELSE inside it
  - Use a second counter to count the passes
  - Trace an algorithm with test data and predict its output
prerequisites:
  - "Repetition: the WHILE loop in pseudocode"
  - "Decisions: IF … THEN … ELSE"
related:
  - loops-and-the-while-loop-in-pseudocode
  - while-loops-in-cpp
updated: 2026-10-09
---

## [explanation] The question

**Exam results processor.** A teacher enters the marks of 5 students. For each student, read the mark and print PASS if the mark is 50 or more, otherwise print FAIL. Count how many students passed and print that number at the end.

**Test data** for your trace: `72`, `45`, `50`, `38`, `90`.

**A. Design the solution**

1. Identify the input, processing and output.
2. Choose the variables and their data types.
3. Write the plain-language steps.
4. Draw the complete flowchart.

**B. Pseudocode and trace**

5. Write the pseudocode using WHILE and IF … ELSE.
6. Label the initialization, condition and update.
7. Trace the test data: how many students passed?
8. What happens if the update line is missing?

**Bonus:** also print EVEN or ODD for each mark, using the `%` operator.

::: tip
Try it on paper before you read the answers below. Answers 1 to 8 follow in order.
:::

## [explanation] Answers 1 and 2: input, processing, output and variables

| Part | Answer |
|---|---|
| Input | `mark`, read 5 times |
| Processing | check `mark >= 50` and count the passes |
| Output | PASS or FAIL for each student, then the number of students who passed |

| Variable | Data type | Job |
|---|---|---|
| `counter` | `int` | counts the students, 1 to 5 |
| `mark` | `int` | the mark just entered (use `float` if marks can have decimals) |
| `passCount` | `int` | how many students passed so far |

## [explanation] Answer 3: the plain-language steps

1. Start.
2. Set counter ← 1 and passCount ← 0.
3. If counter <= 5 is FALSE, go to step 9.
4. Read mark.
5. If mark >= 50, print PASS and add 1 to passCount.
6. Otherwise, print FAIL.
7. Increase counter by 1.
8. Go back to step 3.
9. Print passCount, then End.

## [diagram] Answer 4: the flowchart

The decision `mark >= 50?` sits **inside** the loop. The yellow backward arrow returns to `counter <= 5?`; when that check is NO, passCount is printed and the algorithm ends.

![A flowchart: Start, then counter ← 1 and passCount ← 0, then the diamond counter <= 5?. YES leads to Input mark and the diamond mark >= 50?. Its YES path prints "PASS" and sets passCount ← passCount + 1; its NO path prints "FAIL". The paths join at counter ← counter + 1, and a yellow repeat arrow goes back to counter <= 5?. The NO exit of counter <= 5? leads to Print passCount and End](images/exam-results.png)

## [code] Answers 5 and 6: the pseudocode, with the loop parts

`passCount ← 0` is also set before the loop, because it is a running count. The marks typed are the test data.

```pseudocode program
BEGIN
    counter ← 1
    passCount ← 0
    WHILE counter <= 5 DO
        INPUT mark
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
        ELSE
            PRINT "FAIL"
        END IF
        counter ← counter + 1
    END WHILE
    PRINT passCount
END
```

```input
72
45
50
38
90
```

```output
72
PASS
45
FAIL
50
PASS
38
FAIL
90
PASS
3
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << passCount << endl;
    return 0;
}
```

```notes
2 | counter ← 1 | 1. initialization | circle sky
3 | passCount ← 0 | the count starts at 0 | circle sky
4 | counter <= 5 | 2. condition | square yel
6 | mark >= 50 | decision inside the loop | diamond yel
8 | passCount + 1 | one more pass | tri green
12 | counter ← counter + 1 | 3. update | diamond green
14 | PRINT passCount | after the loop: once | circle green
```

## [explanation] Answer 7: the trace

| Iteration | mark | Output | passCount |
|---|---|---|---|
| 1 | 72 | PASS | 1 |
| 2 | 45 | FAIL | 1 |
| 3 | 50 | PASS | 2 |
| 4 | 38 | FAIL | 2 |
| 5 | 90 | PASS | 3 |

**Result:** passCount = 3. The body runs 5 times, and the condition is checked 6 times: the sixth check, `6 <= 5`, is FALSE.

## [common_mistakes] Answer 8: the missing update

Without `counter ← counter + 1`, `counter` stays 1, so `counter <= 5` is always TRUE. The program keeps asking for marks **forever**: an infinite loop.

## [code] The same algorithm in C++

Next lecture you'll write loops in C++. Here is a preview of this exact algorithm, with a prompt before each mark. Compare it line by line with the pseudocode.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cout << "Enter mark: ";
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << "Students passed: " << passCount << endl;
    return 0;
}
```

```input
72
45
50
38
90
```

```output
Enter mark: 72
PASS
Enter mark: 45
FAIL
Enter mark: 50
PASS
Enter mark: 38
FAIL
Enter mark: 90
PASS
Students passed: 3
```

```notes
6 | int counter = 1; | counter ← 1 | circle sky
9 | while (counter <= 5) | WHILE counter <= 5 DO | square yel
13 | if (mark >= 50) | IF mark >= 50 THEN | diamond yel
22 | counter = counter + 1; | the update | diamond green
24 | cout | after the loop | circle green
```

## [code] Bonus: EVEN or ODD for each mark

Add a second decision inside the loop, right after `INPUT mark`. Only 45 is odd.

```pseudocode program
BEGIN
    counter ← 1
    passCount ← 0
    WHILE counter <= 5 DO
        INPUT mark
        IF mark % 2 == 0 THEN
            PRINT "EVEN"
        ELSE
            PRINT "ODD"
        END IF
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
        ELSE
            PRINT "FAIL"
        END IF
        counter ← counter + 1
    END WHILE
    PRINT passCount
END
```

```input
72
45
50
38
90
```

```output
72
EVEN
PASS
45
ODD
FAIL
50
EVEN
PASS
38
EVEN
FAIL
90
EVEN
PASS
3
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark % 2 == 0)
            cout << "EVEN" << endl;
        else
            cout << "ODD" << endl;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << passCount << endl;
    return 0;
}
```

```notes
6 | mark % 2 == 0 | the bonus decision | diamond sky
```

## [key_takeaways] Key takeaways

- Big problems are solved with the same method: input/processing/output, variables, steps, flowchart, pseudocode.
- A decision can sit inside a loop; it is then made again for every value.
- A second counter (`passCount`) can count how often something happens. It starts at 0, before the loop.
- Print totals **after** the loop, once all the values are in.
- Tracing with test data shows the output before you ever run the program.
