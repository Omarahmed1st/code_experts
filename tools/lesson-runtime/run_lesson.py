"""Runs one lecture program without a screen or a camera, for Code_Expert's tools.

    python3 -I tools/lesson-runtime/run_lesson.py main.py

tools/check-lesson-code.ts runs the lecture programs that can't run in the browser
(OpenCV, graphics.py) through this file, in a temporary folder that holds the
course's images. Three things change, and nothing else:

1. `from graphics import *` finds graphics.py in this folder: a stand-in for Zelle's
   library that records the drawing instead of opening a window.
2. OpenCV's window functions don't open windows. cv2.imshow() keeps the image (and
   saves it as a PNG when the environment variable CODELAB_SHOW_DIR names a folder),
   cv2.waitKey() returns -1 at once, as if no key was pressed, and the destroy
   functions do nothing.
3. cv2.VideoCapture(0) (any camera number) plays a short clip made from street.png
   instead of a camera, then reports that the clip has ended, so a `while True`
   camera loop stops the way it does when a camera is unplugged. A file name still
   opens that file.

Everything the program prints is printed as usual, so its output can be compared
with the lecture's OUTPUT box.
"""
import os
import re
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

shown = []  # (window name, image) for every cv2.imshow() call


def _patch_opencv():
    try:
        import cv2
    except ImportError:
        return
    import numpy as np

    real_capture = cv2.VideoCapture
    show_dir = os.environ.get("CODELAB_SHOW_DIR")

    def imshow(winname, mat):
        image = np.asarray(mat).copy()
        shown.append((str(winname), image))
        if show_dir:
            safe = re.sub(r"[^A-Za-z0-9]+", "-", str(winname)).strip("-").lower() or "window"
            cv2.imwrite(os.path.join(show_dir, "%02d-%s.png" % (len(shown), safe)), image)

    def waitKey(delay=0):
        return -1

    def nothing(*args, **kwargs):
        return None

    class StreetClip:
        """Ten 960 x 540 frames of street.png, panning slowly, like a camera on a slow vehicle."""

        def __init__(self, source=0, *args):
            self.source = source
            scene = cv2.imread("street.png")
            self.frames = []
            if scene is not None:
                h, w = scene.shape[:2]
                for i in range(10):
                    x = 4 * i
                    crop = scene[: h, x : w - 40 + x]
                    self.frames.append(cv2.resize(crop, (960, 540)))
            self.opened = bool(self.frames)

        def isOpened(self):
            return self.opened

        def read(self):
            if not self.opened or not self.frames:
                return False, None
            return True, self.frames.pop(0)

        def get(self, prop):
            if prop == cv2.CAP_PROP_FRAME_WIDTH:
                return 960.0
            if prop == cv2.CAP_PROP_FRAME_HEIGHT:
                return 540.0
            if prop == cv2.CAP_PROP_FPS:
                return 30.0
            return 0.0

        def set(self, prop, value):
            return False

        def release(self):
            self.opened = False
            self.frames = []

    def VideoCapture(source=0, *args):
        if isinstance(source, int):
            return StreetClip(source, *args)
        return real_capture(source, *args)

    cv2.imshow = imshow
    cv2.waitKey = waitKey
    cv2.pollKey = lambda: -1
    cv2.destroyAllWindows = nothing
    cv2.destroyWindow = nothing
    cv2.namedWindow = nothing
    cv2.VideoCapture = VideoCapture


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: run_lesson.py program.py")
    program = sys.argv[1]
    _patch_opencv()
    sys.argv = [program]
    runpy.run_path(program, run_name="__main__")


if __name__ == "__main__":
    main()
