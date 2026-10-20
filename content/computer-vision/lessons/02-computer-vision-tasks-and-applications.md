---
slug: computer-vision-tasks-and-applications
title: Computer vision tasks and applications
topic: introduction-to-computer-vision
lecture: 1
difficulty: easy
description: Follow the five steps of a computer vision pipeline, tell apart the main tasks (classification, detection, segmentation, face recognition, tracking), and see where computer vision is used, from self-driving cars to farms. Ends with the course roadmap.
objectives:
  - Name the five steps of a basic computer vision pipeline in order
  - Tell image classification, object detection and image segmentation apart by their output
  - Describe face recognition and motion tracking in one sentence each
  - Give examples of computer vision applications, including autonomous vehicles
prerequisites:
  - What is computer vision?
related:
  - what-is-computer-vision
  - reading-and-showing-images
updated: 2026-10-15
---

## [explanation] The basic computer vision pipeline

Most computer vision systems work in the same five steps, one after the other:

| Step | What happens | Example: a car's camera |
|---|---|---|
| 1. Image acquisition | a camera captures the image | one frame of the road ahead |
| 2. Image processing | the image is cleaned and prepared | make it the right size, reduce noise |
| 3. Feature extraction | simple, useful patterns are found | edges, corners, lane-line pixels |
| 4. Analysis | the patterns are interpreted | "these edges are the lane; that shape is a car" |
| 5. Decision | the system acts on what it found | keep in lane, slow down |

The labs in this course follow the same order: the next lecture is about step 2 (improving images) and the one after is about step 3 (features).

## [diagram] Five steps from image to decision

![A row of five boxes joined by arrows: Image acquisition, Image processing, Feature extraction, Analysis and Decision. Under each box is a small picture: the street image, the same image in grey, its edges, the edges with the car outlined, and the word Slow down](images/cv-pipeline.png)

## [explanation] The main computer vision tasks

| Task | What it gives you |
|---|---|
| **Image classification** | **one label** for the whole image |
| **Object detection** | each object's **label and location** (a box) |
| **Image segmentation** | a label for **every pixel** |
| **Face recognition** | **who** a face belongs to |
| **Motion tracking** | where an object **moves** from frame to frame |

The first three answer more and more detailed questions about the same image. Classification asks "what is this a picture of?", detection asks "what objects are here, and where?", and segmentation asks "which object does each pixel belong to?".

## [diagram] Classification, detection and segmentation

![Three panels. Classification: a close-up of the red car with the single label car. Detection: the whole street with labelled boxes around the car, the person and the stop sign. Segmentation: the street with every pixel coloured by what it shows, sky, mountain, buildings, grass, road, lane lines, car, tree, sign and person, with a colour key](images/cv-tasks.png)

These outputs were made from the drawing itself: the program that drew `street.png` knows where every object is. A real system has to work them out from the pixels, and that is what the later lectures build towards.

## [explanation] Classification, detection, segmentation

**Image classification** takes an input image and gives back a **class label**: input image → computer vision model → "car". It says what the image shows, but not where.

**Object detection** answers two questions: **what** objects are present, and **where** they are. Each object gets a box and a label. A real detector also gives each box a **confidence score**, a number from 0 to 1 that says how sure it is (0.97 means very sure). The pictures above have no scores, because their boxes come from the drawing, not from a detector.

**Image segmentation** classifies **every pixel** of the image, so it finds the **exact region** of each object, not just a box around it. A self-driving car uses this to know exactly which pixels are road.

## [explanation] Face recognition and motion tracking

- **Face recognition** finds faces and identifies or verifies **who** each one is, as when a phone unlocks for its owner.
- **Motion tracking** follows objects **across video frames**: the same car in frame 1, frame 2, frame 3, so the system knows where it is going.

## [explanation] Where is computer vision used?

| Application | One example |
|---|---|
| **Autonomous vehicles** | find lanes, cars, pedestrians and signs |
| **Medical imaging** | point out suspicious areas in X-rays and scans |
| **Security and surveillance** | notice a person entering a restricted area |
| **Robotics** | let a robot arm see where to grab an object |
| **Manufacturing** | spot faulty products on a production line |
| **Facial recognition** | unlock a phone, check identity at a gate |
| **Agriculture** | find diseased plants or count fruit from a drone |

## [explanation] Computer vision in autonomous vehicles

A self-driving car runs the pipeline many times a second:

**Camera → computer vision → understanding the environment → vehicle decision**

From the camera's view of the road, the computer vision system must find:

- **cars** and **pedestrians**, which move and must be avoided;
- **traffic signs** and **traffic lights**, which say what is allowed;
- **lane lines**, which say where the car should drive.

Only when all of these are understood can the car decide to continue, turn, slow down or stop. This course's semester project builds a small version of exactly this system.

## [diagram] What a car's camera has to find

![The street image with the lane lines highlighted in light blue and labelled boxes around the car, the person and the stop sign](images/cv-road-understanding.png)

Our drawing has no traffic light, but every other item on the list is there. Again, the boxes and highlighted lanes come from the drawing, to show what a working system must produce.

## [explanation] Course roadmap

What we will explore this semester:

1. Image enhancement and restoration
2. Feature detection and matching
3. Object detection
4. Deep learning for image classification
5. Semantic segmentation
6. 3D reconstruction
7. Motion analysis
8. Visual SLAM (building a map while finding where the camera is)
9. Vision-based navigation

Each topic adds one more ability, and the semester project puts them together on a vehicle.

## [note] Check yourself

::: check Which task fits each job? (a) Decide whether a photo shows a cat or a dog. (b) Draw a box around every person in a crowd. (c) Colour every pixel of the road in a dashcam image.
???
(a) **Image classification**: one label for the whole image. (b) **Object detection**: a label and a box for each object. (c) **Image segmentation**: a label for every pixel.
:::

::: check In the pipeline, which step finds edges and corners: image processing or feature extraction?
???
**Feature extraction** (step 3). Image processing (step 2) only prepares the image, for example by resizing it or removing noise.
:::

## [common_mistakes] Common mistakes

- **Mixing up detection and segmentation.** Detection gives a **box** around each object; segmentation gives the **exact pixels**.
- **Thinking classification says where.** A classifier says "car" for the whole image, not where the car is.
- **Skipping step 2.** A dark or noisy image makes every later step worse. That is why the next lecture is about improving images.

## [key_takeaways] Key takeaways

- The pipeline: **acquisition → processing → feature extraction → analysis → decision**.
- Classification gives one label, detection gives labels with boxes, segmentation labels every pixel.
- Face recognition says who; motion tracking follows objects across frames.
- Self-driving cars must find cars, pedestrians, signs, traffic lights and lane lines before they decide.
