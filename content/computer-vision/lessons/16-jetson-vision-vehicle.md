---
slug: jetson-vision-vehicle
title: "The semester project: a Jetson vision vehicle"
topic: jetson-projects
lecture: 3
difficulty: easy
description: Meet the semester project, a vehicle that sees with a camera and thinks with an NVIDIA Jetson. Learn its SEE, UNDERSTAND, DECIDE, ACT idea, what edge AI means, the main loop that runs for every frame, and how the teams will build it.
objectives:
  - Describe the project's architecture from camera to vehicle action
  - Explain SEE, UNDERSTAND, DECIDE and ACT with an example for each
  - Explain what an NVIDIA Jetson is and what edge AI means
  - Describe the main loop and calculate the time per frame at a given FPS
prerequisites:
  - Matching features between two images
related:
  - feature-matching
  - live-camera-pipeline
updated: 2026-10-15
---

## [explanation] What if the camera is moving?

So far every image sat still: a file, read once. Now follow the steps:

1. a **fixed image**;
2. a **camera** that takes images;
3. a **moving camera**;
4. that camera **mounted on a vehicle**.

What changes on the vehicle? The images keep changing, there is no time to wait, and the system must understand the road, cars and people **while it moves**:

**Camera → frames → computer vision → understanding the environment**

Let's build one.

## [explanation] The semester project

**ECE4704 semester project: a Jetson-based intelligent vision vehicle.**

The question behind it: **how can we make a vehicle SEE and UNDERSTAND its environment?**

The project is not only about moving a car. Driving motors is the easy part. **The main goal is the vehicle's visual intelligence**, and every lab adds a piece of it.

The whole system in one line:

**Camera → NVIDIA Jetson → computer vision → environment understanding → decision → vehicle action**

The camera captures, the Jetson runs our computer vision, the vision results become an understanding of the scene, that understanding becomes a decision, and the decision becomes an action.

## [explanation] The big idea: SEE → UNDERSTAND → DECIDE → ACT

| Stage | What happens | Examples |
|---|---|---|
| 1. **SEE** | the camera captures the environment | camera frames |
| 2. **UNDERSTAND** | computer vision detects important information | lane, car, person, obstacle, traffic sign |
| 3. **DECIDE** | the system decides what should happen | continue, turn, slow down, stop |
| 4. **ACT** | the vehicle performs the action | motors, steering |

**Computer vision connects the camera to intelligent vehicle behaviour.** This course is mostly about stage 2, because stages 3 and 4 can only be as good as what the vision system tells them.

## [diagram] SEE, UNDERSTAND, DECIDE, ACT

![Four boxes in a row joined by arrows. SEE: a camera frame of the street. UNDERSTAND: the same frame with the lane and the car outlined. DECIDE: the choices continue, turn, slow down and stop, with slow down highlighted. ACT: motors and steering](images/cv-see-understand-decide-act.png)

## [explanation] What is NVIDIA Jetson?

**NVIDIA Jetson** is a family of small computers designed for **computer vision**, **artificial intelligence**, **robotics** and **edge AI**. It has a graphics processor (GPU), so it runs vision and deep-learning code fast, while being small enough to sit on a robot. It runs Linux and Python with OpenCV, so the code you write on your laptop carries over.

Compare two ways to give a vehicle "brains":

| Without a computer on board | Edge AI (our project) |
|---|---|
| the vehicle's camera sends video over a **network** to another computer | the camera's frames are processed **on the vehicle**, by the Jetson |
| the vehicle **waits** for the answer to come back | the decision is made **on board** |
| slow, and useless if the connection drops | fast, and works without a network |

**Edge AI: AI processing happens close to where the data is generated.**

## [explanation] Project hardware concept

| Part | Kind | Job |
|---|---|---|
| **Camera** | hardware | the eyes of the vehicle |
| **NVIDIA Jetson** | hardware | the processing computer |
| **Computer vision software** | software, on the Jetson | understands what the camera sees |
| **Decision** | software, on the Jetson | chooses what should happen |
| **Motor control system** | hardware | converts the decision into movement |
| **Motors / wheels** | hardware | move the vehicle |

The exact boards and wiring may change during the semester. That doesn't affect our code: the vision software only has to output a decision such as continue, turn, slow down or stop. Most of this course lives in the two software rows.

## [explanation] What happens every second? The main loop

While the vehicle is operating, it repeats the same eight steps, for every frame:

1. The camera captures a frame.
2. The Jetson receives the frame.
3. The image is processed.
4. Features or objects are detected.
5. The environment is understood.
6. A decision is generated.
7. The vehicle responds.
8. Capture the next frame, and repeat.

In code, this is literally a `while True:` loop: **one pass through the loop = one frame.** Today we build steps 1 to 4, with edges as our first features.

What happens if one pass is too slow? The vehicle reacts late. That is why speed, measured in **frames per second (FPS)**, will matter.

## [explanation] Video is just many images

**Video = frame 1 + frame 2 + frame 3 + frame 4 + …** A **frame** is one image from the video. Played quickly, a little change from frame to frame looks like motion.

**30 FPS** means about 30 frames every second: a new image about every **33 milliseconds**. Our processing has to keep up with that.

The good news: a frame is exactly the same kind of object as the images you loaded with `imread()` in lecture 2, a NumPy array of pixels. **Everything we did to `street.png` can now be applied to every frame.**

## [diagram] Four frames of a test clip

![Four frames of the street, side by side and numbered 1 to 4. Each one is shifted very slightly to the right compared with the one before, as if a camera were moving slowly](images/cv-frames.png)

These are the first four frames of the test clip used to record the outputs in the next lesson: the street, shifting a few pixels each frame, like a slow camera.

## [code] How much time does each frame get?

At 30 FPS, the whole loop (capture, process, detect, decide) has about 33 ms per frame. If it takes longer, frames are processed late or skipped. This program, which runs in your browser, works out the time for three frame rates.

```python program run
for fps in [10, 30, 60]:
    ms_per_frame = 1000 / fps
    print(fps, "FPS:", round(ms_per_frame, 1), "ms per frame")
```

```output
10 FPS: 100.0 ms per frame
30 FPS: 33.3 ms per frame
60 FPS: 16.7 ms per frame
```

```notes
1 | [10, 30, 60] | three frame rates | circle sky
2 | 1000 / fps | 1000 ms in a second | square yel
```

## [explanation] We will build it step by step

| When | Topic | What it gives the vehicle |
|---|---|---|
| Lecture 2 | image enhancement | better camera frames |
| **Lecture 3 (today)** | feature detection | the image's structure: edges, lanes |
| Lecture 4 | object detection | cars, people and objects |
| Lecture 5 | deep-learning classification | recognising the important objects |
| Later | motion, SLAM, navigation | movement and the surroundings |
| Final | integrated vision vehicle | all capabilities working together |

**Every new lab adds one new capability to the project.**

## [explanation] How will we divide the project?

**Step 1, now: build the baseline together.** Every team builds the same basic vision pipeline first:

**Camera → read frames → resize → grayscale → image processing → edge detection**

That is today's Project Part 1. Every later module (lanes, objects, decisions) uses the frames from this pipeline, so everyone must understand it, and every team has a working system before anyone specialises.

**Step 2, later: divide the modules.**

| Module | Responsible for |
|---|---|
| 1. Camera and image processing | camera connection, frame reading, resizing, image quality, noise reduction |
| 2. Lane and feature detection | edge detection, region of interest, lane detection, feature tracking |
| 3. Object detection | vehicles, people, obstacles, traffic signs |
| 4. Decision and vehicle control | use the vision results to decide: stop, turn, continue, slow down |
| 5. Integration and testing | connect the modules, test performance, debug, measure FPS, test the complete system |

**Every team should still understand the overall project pipeline**: your module only works if the others do.

## [note] Check yourself

::: check A team's loop takes 50 ms per frame. How many frames per second can it handle?
???
**20 FPS**: 1000 ÷ 50 = 20. That is slower than a 30 FPS camera, so frames would arrive faster than they are processed.
:::

::: check The vehicle's camera sees a person crossing. Which stage, SEE, UNDERSTAND, DECIDE or ACT, recognises the person, and which one stops the wheels?
???
**UNDERSTAND** recognises the person (computer vision). **DECIDE** chooses "stop", and **ACT** stops the wheels through the motor control system.
:::

## [common_mistakes] Common misunderstandings

- **"The project is about driving a car."** Moving is the easy part; the course is about what the vehicle understands from its camera.
- **"Edge AI means AI at the edges of the image."** Edge AI means the processing happens on the device, close to where the data is captured.
- **"A video needs different code from an image."** A frame is an image; the same OpenCV functions work on it.

## [key_takeaways] Key takeaways

- The project: **camera → Jetson → computer vision → understanding → decision → action**.
- **SEE → UNDERSTAND → DECIDE → ACT**; this course is mostly about UNDERSTAND.
- A Jetson is a small GPU computer for vision and AI on the vehicle itself: **edge AI**.
- The main loop handles one frame per pass; at 30 FPS each frame gets about 33 ms.
