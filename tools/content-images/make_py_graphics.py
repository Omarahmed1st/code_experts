"""Draws the window pictures for the Python graphics lectures
(content/programming-applications/images/py-*.png).

    python3 tools/content-images/make_py_graphics.py

Each picture comes from running the program shown in a lecture section with
tools/lesson-runtime/graphics.py, a stand-in for Zelle's graphics.py that records
the drawing instead of opening a window, and then drawing what it recorded with
Pillow. So a picture can't drift away from its code: change the program in the
lecture and run this again. Clicks are scripted per picture.

What the real library would show is drawn as the window: a title bar and the
drawing area, in the system's default light grey. Teaching marks are added on top
and look different on purpose: navy dashed lines and yellow labels such as
"(100, 150)". Points are one pixel on a real screen; here they are drawn bigger.

Needs Pillow and the Liberation Sans and DejaVu Sans fonts (they come with most
Linux systems; set FONT_DIR to a folder holding the .ttf files otherwise).
"""
import contextlib
import io
import math
import os
import pathlib
import re
import sys

from PIL import Image, ImageColor, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
LESSONS = ROOT / "content" / "programming-applications" / "lessons"
OUT = ROOT / "content" / "programming-applications" / "images"
sys.path.insert(0, str(ROOT / "tools" / "lesson-runtime"))
import graphics  # noqa: E402  (the stand-in)

FONT_DIR = pathlib.Path(os.environ.get("FONT_DIR", "/usr/share/fonts/truetype"))


def font_file(*names):
    for name in names:
        for found in FONT_DIR.rglob(name):
            return str(found)
    raise SystemExit("font not found: %s (set FONT_DIR)" % ", ".join(names))


SANS = font_file("LiberationSans-Regular.ttf")
SANS_BOLD = font_file("LiberationSans-Bold.ttf")
LABEL = font_file("DejaVuSans-Bold.ttf")

SCALE = 2           # output pixels per window pixel (sharp on high-density screens)
SS = 2              # extra supersampling while drawing, for smooth edges
F = SCALE * SS      # drawing pixels per window pixel
TITLE_H = 32        # title bar height, in window pixels
WINDOW_BG = "#F0F0F0"  # Tk's default canvas colour on Windows (SystemButtonFace)
NAVY = "#14213D"
YELLOW = "#FFD43B"
FRAME = "#9AA4B2"

# Tk 8.6 colour names match the web's, so Pillow can read them. Tk also accepts
# names with spaces ("light blue"); Pillow wants them without.
def rgb(color):
    if color in ("", None):
        return None
    return ImageColor.getrgb(str(color).replace(" ", "").lower())


def font(path, px):
    return ImageFont.truetype(path, max(1, round(px)))


def program_of(lesson, section):
    """The ```python program block of the section '## [code] <section>' in a lecture file."""
    text = (LESSONS / lesson).read_text(encoding="utf8")
    parts = re.split(r"^## \[(\w+)\] (.+)$", text, flags=re.M)
    for i in range(1, len(parts), 3):
        if parts[i + 1].strip() == section:
            m = re.search(r"^```python program[^\n]*\n(.*?)^```", parts[i + 2], flags=re.M | re.S)
            if m:
                return m.group(1)
    raise SystemExit("no program in %s > %s" % (lesson, section))


def run(code, clicks=()):
    """Runs a program with the stand-in; returns its first window and what it printed."""
    graphics.windows.clear()
    graphics.scripted_clicks[:] = list(clicks)
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(compile(code, "<lecture>", "exec"), {"__name__": "__main__"})
    if graphics.scripted_clicks:
        raise SystemExit("unused clicks: %r" % graphics.scripted_clicks)
    return graphics.windows[0], out.getvalue()


class Canvas:
    """A window picture: title bar plus drawing area, drawn at F pixels per window pixel."""

    def __init__(self, title, width, height, background=None):
        self.w, self.h = width, height
        self.img = Image.new("RGB", ((width + 2) * F, (height + TITLE_H + 2) * F), rgb(FRAME))
        self.d = ImageDraw.Draw(self.img)
        d = self.d
        # Title bar: an icon, the title, and minimise / maximise / close.
        d.rectangle([F, F, (width + 1) * F - 1, (TITLE_H + 1) * F - 1], fill=(255, 255, 255))
        d.rounded_rectangle([12 * F, 9 * F, 26 * F, 23 * F], radius=3 * F, fill=rgb("#3776AB"))
        d.text((34 * F, (TITLE_H / 2 + 1) * F), title, font=font(SANS, 13 * F), fill=rgb("#1F2933"), anchor="lm")
        cx = (width + 1) * F
        for i, glyph in enumerate(("close", "max", "min")):
            mid_x = cx - (23 + 46 * i) * F
            mid_y = (TITLE_H / 2 + 1) * F
            s = 5 * F
            if glyph == "close":
                d.line([mid_x - s, mid_y - s, mid_x + s, mid_y + s], fill=rgb("#1F2933"), width=F)
                d.line([mid_x - s, mid_y + s, mid_x + s, mid_y - s], fill=rgb("#1F2933"), width=F)
            elif glyph == "max":
                d.rectangle([mid_x - s, mid_y - s, mid_x + s, mid_y + s], outline=rgb("#1F2933"), width=F)
            else:
                d.line([mid_x - s, mid_y, mid_x + s, mid_y], fill=rgb("#1F2933"), width=F)
        # Drawing area, drawn separately so shapes can't spill onto the frame.
        self.area = Image.new("RGB", (width * F, height * F), rgb(background or WINDOW_BG))
        self.ad = ImageDraw.Draw(self.area)

    def xy(self, x, y):
        """Where window point (x, y) is in the picture (for teaching marks)."""
        return ((x + 1) * F, (y + TITLE_H + 1) * F)

    def at(self, x, y):
        """Where window point (x, y) is in the drawing area."""
        return (x * F, y * F)

    def shape(self, s):
        d = self.ad
        if s["kind"] == "point":
            x, y = self.at(s["x"], s["y"])
            r = 3 * F
            d.ellipse([x - r, y - r, x + r, y + r], fill=rgb(s["color"]))
        elif s["kind"] in ("rectangle", "oval"):
            draw = d.rectangle if s["kind"] == "rectangle" else d.ellipse
            x1, y1 = self.at(min(s["x1"], s["x2"]), min(s["y1"], s["y2"]))
            x2, y2 = self.at(max(s["x1"], s["x2"]), max(s["y1"], s["y2"]))
            draw([x1, y1, x2, y2], fill=rgb(s["fill"]), outline=rgb(s["outline"]), width=max(1, round(s["width"] * F)))
        elif s["kind"] == "line":
            d.line([*self.at(s["x1"], s["y1"]), *self.at(s["x2"], s["y2"])], fill=rgb(s["color"]),
                   width=max(1, round(s["width"] * F)))
        elif s["kind"] == "polygon":
            pts = [self.at(x, y) for x, y in s["points"]]
            d.polygon(pts, fill=rgb(s["fill"]), outline=rgb(s["outline"]), width=max(1, round(s["width"] * F)))
        elif s["kind"] == "text":
            px = s["size"] * 96 / 72  # Tk sizes are points; 96 pixels per inch
            path = SANS_BOLD if "bold" in s["style"] else SANS
            d.text(self.at(s["x"], s["y"]), s["text"], font=font(path, px * F), fill=rgb(s["color"]), anchor="mm")
        else:
            raise SystemExit("can't draw %r" % s["kind"])

    def finish_window(self):
        """Puts the drawing area in the window; shapes that stick out of it are cut off, as on screen."""
        self.img.paste(self.area, self.xy(0, 0))

    # Teaching marks ---------------------------------------------------------
    def dashed(self, pts, color=NAVY, width=1.5, dash=6, gap=5):
        d = self.d
        pts = [self.xy(x, y) for x, y in pts]
        on, left = True, dash * F
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            seg = math.hypot(bx - ax, by - ay)
            pos = 0.0
            while pos < seg:
                step = min(left, seg - pos)
                if on:
                    t1, t2 = pos / seg, (pos + step) / seg
                    d.line([ax + (bx - ax) * t1, ay + (by - ay) * t1, ax + (bx - ax) * t2, ay + (by - ay) * t2],
                           fill=rgb(color), width=round(width * F))
                pos += step
                left -= step
                if left <= 0:
                    on = not on
                    left = (dash if on else gap) * F

    def ghost(self, s):
        """A shape's old position: a dashed outline."""
        if s["kind"] == "oval":
            cx, cy = (s["x1"] + s["x2"]) / 2, (s["y1"] + s["y2"]) / 2
            rx, ry = abs(s["x2"] - s["x1"]) / 2, abs(s["y2"] - s["y1"]) / 2
            pts = [(cx + rx * math.cos(t / 90 * math.pi), cy + ry * math.sin(t / 90 * math.pi)) for t in range(181)]
            self.dashed(pts)
        elif s["kind"] == "rectangle":
            x1, y1, x2, y2 = s["x1"], s["y1"], s["x2"], s["y2"]
            self.dashed([(x1, y1), (x2, y1), (x2, y2), (x1, y2), (x1, y1)])

    def tag(self, x, y, text, dx=10, dy=-16, anchor="lm"):
        """A yellow label with navy text near (x, y)."""
        f = font(LABEL, 13 * F)
        px, py = self.xy(x + dx, y + dy)
        l, t, r, b = self.d.textbbox((px, py), text, font=f, anchor=anchor)
        pad = 4 * F
        self.d.rounded_rectangle([l - pad, t - pad, r + pad, b + pad], radius=4 * F, fill=rgb(YELLOW))
        self.d.text((px, py), text, font=f, fill=rgb(NAVY), anchor=anchor)

    def dot(self, x, y, r=4, color=NAVY):
        px, py = self.xy(x, y)
        self.d.ellipse([px - r * F, py - r * F, px + r * F, py + r * F], fill=rgb(color))

    def cross(self, x, y, arm=7, color=NAVY):
        px, py = self.xy(x, y)
        a = arm * F
        self.d.line([px - a, py, px + a, py], fill=rgb(color), width=F)
        self.d.line([px, py - a, px, py + a], fill=rgb(color), width=F)

    def cursor(self, x, y):
        """A mouse pointer whose tip is at (x, y)."""
        shape = [(0, 0), (0, 17), (4, 13), (7, 20), (10, 19), (7, 12), (12, 12)]
        pts = [self.xy(x + a, y + b) for a, b in shape]
        self.d.polygon(pts, fill=(255, 255, 255), outline=rgb("#111111"), width=round(1.2 * F))

    def arrow(self, x1, y1, x2, y2, color=NAVY, width=2):
        a, b = self.xy(x1, y1)
        c, e = self.xy(x2, y2)
        self.d.line([a, b, c, e], fill=rgb(color), width=round(width * F))
        ang = math.atan2(e - b, c - a)
        L = 10 * F
        for side in (-0.45, 0.45):
            self.d.line([c, e, c - L * math.cos(ang + side), e - L * math.sin(ang + side)], fill=rgb(color),
                        width=round(width * F))

    def save(self, name):
        img = self.img.resize((self.img.width // SS, self.img.height // SS), Image.LANCZOS)
        OUT.mkdir(parents=True, exist_ok=True)
        img.save(OUT / name, optimize=True)
        print("wrote", name, img.size)


def picture(name, lesson, section, clicks=(), snap=-1, ghost_snap=None, marks=None, expect_output=None):
    """Runs one lecture program and draws the window as it was at snapshot `snap`."""
    code = program_of(lesson, section)
    win, printed = run(code, clicks)
    if expect_output is not None and printed != expect_output:
        raise SystemExit("%s printed %r, expected %r" % (name, printed, expect_output))
    shots = [s for s in win.snapshots if s[0] == "getMouse"] or win.snapshots
    scene = shots[snap][2]
    c = Canvas(win.title, win.width, win.height, win.background)
    for s in scene:
        c.shape(s)
    c.finish_window()
    if ghost_snap is not None:
        for s in shots[ghost_snap][2]:
            c.ghost(s)
    if marks:
        marks(c)
    c.save(name)


def guides(c, x, y):
    c.dashed([(x, 0), (x, y)])
    c.dashed([(0, y), (x, y)])


# Lecture: Graphics: windows and coordinates -------------------------------------
L10 = "10-graphics-windows-and-coordinates.md"
picture("py-first-window.png", L10, "Our first graphics window")

c = Canvas("A 500 × 400 window", 500, 400)
for x in range(50, 500, 50):
    c.ad.line([*c.at(x, 0), *c.at(x, 400)], fill=rgb("#D5DBE5"), width=F)
for y in range(50, 400, 50):
    c.ad.line([*c.at(0, y), *c.at(500, y)], fill=rgb("#D5DBE5"), width=F)
c.finish_window()
c.arrow(30, 22, 200, 22)
c.tag(206, 22, "x grows to the right", dx=4, dy=0)
c.arrow(22, 30, 22, 170)
c.tag(30, 160, "y grows down", dx=4, dy=0)
c.dot(0, 0, r=5)
c.tag(4, 0, "(0, 0)", dx=6, dy=44)
c.tag(500, 0, "(500, 0)", dx=-8, dy=44, anchor="rm")
c.tag(0, 400, "(0, 400)", dx=8, dy=-16)
c.tag(500, 400, "(500, 400)", dx=-8, dy=-16, anchor="rm")
c.dot(250, 200, r=5)
c.tag(250, 200, "Point(250, 200)")
c.save("py-coordinates.png")

# Lecture: Drawing shapes -----------------------------------------------------------
L11 = "11-drawing-shapes.md"
picture("py-point.png", L11, "The Point object",
        marks=lambda c: (guides(c, 100, 150), c.tag(100, 150, "(100, 150)")))
picture("py-points.png", L11, "Drawing several points",
        marks=lambda c: (c.tag(100, 100, "p1 (100, 100)"), c.tag(200, 150, "p2 (200, 150)"),
                         c.tag(300, 250, "p3 (300, 250)")))
picture("py-line.png", L11, "Drawing a line",
        marks=lambda c: (c.dot(100, 100), c.dot(300, 200), c.tag(100, 100, "p1 (100, 100)", dx=0, dy=-22, anchor="mm"),
                         c.tag(300, 200, "p2 (300, 200)", dy=16)))
picture("py-circle.png", L11, "Drawing a circle",
        marks=lambda c: (c.dot(250, 200), c.dashed([(250, 200), (330, 200)]), c.tag(290, 200, "radius = 80", dx=0, dy=-18, anchor="mm"),
                         c.tag(250, 200, "center (250, 200)", dx=0, dy=22, anchor="mm")))
picture("py-rectangle.png", L11, "Drawing a rectangle",
        marks=lambda c: (c.dot(100, 100), c.dot(300, 250), c.tag(100, 100, "Point 1 (100, 100)", dx=-6, dy=-18),
                         c.tag(300, 250, "Point 2 (300, 250)", dx=-90, dy=22),
                         c.tag(200, 175, "200 × 150", dx=0, dy=0, anchor="mm")))
picture("py-more-shapes.png", L11, "Four shapes in one window")

# Lecture: Colours, moving and text -------------------------------------------------
L12 = "12-colors-moving-and-text.md"
picture("py-colors.png", L12, "Colouring a circle")
picture("py-color-row.png", L12, "A row of colours")
picture("py-move.png", L12, "Moving a circle three times", snap=1, ghost_snap=0,
        marks=lambda c: (c.dot(250, 200), c.dot(400, 200), c.tag(250, 200, "start (250, 200)", dx=0, dy=72, anchor="mm"),
                         c.tag(400, 200, "after 3 moves (400, 200)", dx=0, dy=-72, anchor="mm"),
                         c.arrow(262, 200, 388, 200)))
picture("py-text.png", L12, "A blue title",
        marks=lambda c: (c.cross(250, 50), c.tag(250, 50, "centred on Point(250, 50)", dx=0, dy=44, anchor="mm")))

# Lecture: Mouse clicks -------------------------------------------------------------
L13 = "13-mouse-clicks.md"
picture("py-click.png", L13, "Where did you click?", clicks=[(320, 180)], snap=0,
        expect_output="320.0\n180.0\n",
        marks=lambda c: (c.cursor(320, 180), c.tag(320, 180, "click at (320, 180)", dx=20, dy=36)))
picture("py-click-circle.png", L13, "Click to create a circle", clicks=[(320, 180), (100, 100)], snap=1,
        marks=lambda c: c.tag(320, 180, "click (320, 180)", dx=0, dy=52, anchor="mm"))
picture("py-target.png", L13, "Interactive target: the complete program", clicks=[(310, 230), (100, 100)], snap=1)

# Lecture: Graphics practice --------------------------------------------------------
L14 = "14-graphics-practice-and-debugging.md"
picture("py-traffic-light.png", L14, "Traffic light: one possible solution")
picture("py-sun.png", L14, "The fixed program")

# The house has no code in the lecture (it is the students' project), so its
# program lives here. It only uses what the lectures teach.
HOUSE = '''
from graphics import *

win = GraphWin("My House", 500, 400)
win.setBackground("lightblue")

grass = Rectangle(Point(0, 300), Point(500, 400))
grass.setFill(color_rgb(95, 170, 80))
grass.setOutline(color_rgb(95, 170, 80))
grass.draw(win)
ground = Line(Point(0, 300), Point(500, 300))
ground.setWidth(3)
ground.setOutline(color_rgb(60, 90, 50))
ground.draw(win)

body = Rectangle(Point(150, 180), Point(350, 300))
body.setFill(color_rgb(205, 120, 70))
body.draw(win)
roof = Polygon(Point(130, 180), Point(250, 95), Point(370, 180))
roof.setFill("firebrick")
roof.draw(win)
door = Rectangle(Point(230, 235), Point(270, 300))
door.setFill(color_rgb(90, 55, 30))
door.draw(win)
for x in [170, 290]:
    window = Rectangle(Point(x, 205), Point(x + 40, 245))
    window.setFill("white")
    window.draw(win)

sun = Circle(Point(425, 70), 35)
sun.setFill("yellow")
sun.setOutline("orange")
sun.draw(win)
title = Text(Point(90, 35), "My House")
title.setSize(18)
title.setStyle("bold")
title.draw(win)

win.getMouse()
win.close()
'''
win, _ = run(HOUSE)
c = Canvas(win.title, win.width, win.height, win.background)
for s in win.snapshots[0][2]:
    c.shape(s)
c.finish_window()
c.save("py-house.png")
