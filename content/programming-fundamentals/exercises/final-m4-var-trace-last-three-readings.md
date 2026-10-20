---
slug: final-m4-var-trace-last-three-readings
type: trace
title: Keeping the last three readings
lesson: variables-named-boxes-in-memory
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A weather station keeps only the **last three** temperature readings, in the boxes `first` (oldest), `second` and `third` (newest). When a new reading arrives, every value should move one box toward `first`, and the oldest one is dropped. The program does this twice: for the reading 30, then for the reading 28, but the second time the three lines are in a different order. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int first = 21;
    int second = 24;
    int third = 26;
    first = second;
    second = third;
    third = 30;
    cout << first << " " << second << " " << third << endl;
    cout << (first + second + third) / 3 << endl;
    first = second;
    third = 28;
    second = third;
    cout << first << " " << second << " " << third << endl;
    cout << (first + second + third) / 3 << endl;
    return 0;
}
```

## Answer

```output
24 26 30
26
26 28 28
27
```

## Hints

- A box holds **one** value. When a line stores a new value, the old one is gone, and every later line sees only the new one.
- On line 15, `third` already holds 28, not 30.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | three readings | first = 21; second = 24; third = 26 | |
| 8 | copy `second` into `first` | first = 24; second = 24; third = 26 | |
| 9 | copy `third` into `second` | first = 24; second = 26; third = 26 | |
| 10 | the new reading | first = 24; second = 26; third = 30 | |
| 11 | print the boxes | first = 24; second = 26; third = 30 | 24 26 30\n |
| 12 | 80 / 3 is int / int | first = 24; second = 26; third = 30 | 26\n |
| 13 | copy `second` into `first` | first = 26; second = 26; third = 30 | |
| 14 | the new reading replaces 30 | first = 26; second = 26; third = 28 | |
| 15 | copy `third` into `second` | first = 26; second = 28; third = 28 | |
| 16 | print the boxes | first = 26; second = 28; third = 28 | 26 28 28\n |
| 17 | 82 / 3 is int / int | first = 26; second = 28; third = 28 | 27\n |

## Explanation

Each `=` copies the value that the right-hand box holds **at that moment**, and the old value of the left-hand box is lost.

**The first shift works.** Line 8 copies 24 into `first` (the oldest reading, 21, is dropped, as planned). Line 9 copies 26 into `second`. Only then does line 10 put the new reading, 30, into `third`. Every value moved one box, so line 11 prints `24 26 30`. The sum is 80, and `80 / 3` with two `int`s is 26.

**The second shift loses a reading.** Line 13 is fine: `first` gets 26. But line 14 stores 28 in `third` **before** its old value, 30, has been copied anywhere. So 30 is gone. Line 15 then copies the new 28 into `second`. The boxes hold `26 28 28`: the reading 30 has vanished and 28 appears twice. The average becomes `82 / 3` = 27.

The rule for shifting values is to copy from the **oldest end first**: `first = second;`, then `second = third;`, and only at the end overwrite `third` with the new value.
