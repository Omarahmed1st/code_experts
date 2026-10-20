---
slug: cvj-decide-stage
type: mcq
title: Which stage chose to slow down?
lesson: jetson-vision-vehicle
difficulty: easy
updated: 2026-10-16
---

## Question

The vehicle's camera shows a car close ahead. The vision system reports "car, 3 metres ahead", and the system then chooses **slow down**. Which stage chose "slow down"?

## Options

- [x] DECIDE
  Right: DECIDE turns what the vision system understood into a choice: continue, turn, slow down or stop.
- [ ] SEE
  SEE only captures the frame with the camera.
- [ ] UNDERSTAND
  UNDERSTAND found the car and its distance. Choosing what to do about it is the next stage.
- [ ] ACT
  ACT carries out the choice through the motors and steering. The choice was already made.

## Explanation

**SEE → UNDERSTAND → DECIDE → ACT**

| Stage | Here |
|---|---|
| SEE | the camera captures the frame |
| UNDERSTAND | computer vision finds the car ahead |
| DECIDE | the system chooses "slow down" |
| ACT | the motor control slows the wheels |

This course is mostly about UNDERSTAND, because DECIDE and ACT can only be as good as what the vision system tells them.
