"""Draws the images for the Computer Vision lab lectures (content/computer-vision/images/).

    python3 tools/content-images/make_cv_lab_images.py

Two kinds of picture come out of it:

1. Test images that the lecture programs read and that students download:
   street.png (a drawn street scene, 960 x 540), poor-street.png (the same scene
   dark, flat and noisy, for the "fix this image" challenge) and view-a.png /
   view-b.png (two views of the street, as if the camera moved, for matching).
   They are drawn here, not photographed, so there are no rights questions and
   anyone can make them again.
2. The result pictures shown in the lectures. Most of them are made by running the
   lecture's own program through tools/lesson-runtime/run_lesson.py, which saves
   every cv2.imshow() window as a PNG; this script then puts those windows side by
   side with their labels. So a picture shows what its code really produces.
   Numbers written on pictures (percentages, counts) are measured here too.

Needs opencv-python, numpy and Pillow, the DejaVu fonts (most Linux systems have
them; set FONT_DIR otherwise) and node_modules (for the site's Poppins font; DejaVu
Sans is used when it is missing). Results were made
with the OpenCV and NumPy versions printed at the start; other versions can give
slightly different numbers (ORB in particular).
"""
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "content" / "computer-vision" / "images"
LESSONS = ROOT / "content" / "computer-vision" / "lessons"
RUNNER = ROOT / "tools" / "lesson-runtime" / "run_lesson.py"
OUT.mkdir(parents=True, exist_ok=True)

print("OpenCV", cv2.__version__, "NumPy", np.__version__)


def save(name, img):
    cv2.imwrite(str(OUT / name), img, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print("wrote %-28s %s %6.0f KB" % (name, img.shape, (OUT / name).stat().st_size / 1024))


# ---------------------------------------------------------------------------
# 1. The street scene (BGR colours)
# ---------------------------------------------------------------------------
W, H = 960, 540
HORIZON = 300
rng = np.random.default_rng(4704)


# What each pixel of street.png shows, for the segmentation picture. draw_street()
# paints this label map with the same shapes as the picture itself.
CLASSES = ["sky", "mountain", "building", "grass", "road", "lane line", "car", "tree", "sign", "person"]
SKY, MOUNTAIN, BUILDING, GRASS, ROAD, LANE, CAR, TREE, SIGN, PERSON = range(len(CLASSES))


def draw_street():
    img = np.zeros((H, W, 3), np.uint8)
    lab = np.zeros((H, W), np.uint8)

    def paint(fn, geometry, colour, cls, *rest):
        """Draws a shape on the picture and the same shape, as class `cls`, on the label map."""
        fn(img, *geometry, colour, *rest)
        fn(lab, *geometry, cls, *[cv2.LINE_8 if r == cv2.LINE_AA else r for r in rest])

    # Sky: a soft gradient, lighter near the horizon.
    for y in range(HORIZON):
        t = y / HORIZON
        img[y, :] = (int(232 + 16 * t), int(196 + 34 * t), int(140 + 60 * t))
    # Sun and soft-edged clouds.
    cv2.circle(img, (845, 78), 38, (70, 205, 255), -1, cv2.LINE_AA)
    clouds = np.zeros((H, W), np.uint8)
    for cx, cy, a, b in ((600, 70, 70, 20), (650, 58, 46, 22), (140, 52, 60, 16), (185, 44, 40, 18)):
        cv2.ellipse(clouds, (cx, cy), (a, b), 0, 0, 360, 255, -1, cv2.LINE_AA)
    soft = cv2.GaussianBlur(clouds, (0, 0), 5)[:, :, None] / 255.0
    img[:] = (img * (1 - soft) + np.array((250, 248, 246)) * soft).astype(np.uint8)
    # Mountains with snow caps.
    for peak, left, right, colour in (((520, 150), 330, 760, (150, 128, 112)), ((700, 175), 560, 900, (138, 120, 106))):
        paint(cv2.fillPoly, [[np.array([[left, HORIZON], peak, [right, HORIZON]], np.int32)]], colour, MOUNTAIN, cv2.LINE_AA)
        px, py = peak
        cap = np.array([[px, py], [px - 34, py + 26], [px - 12, py + 20], [px + 4, py + 30], [px + 30, py + 24]], np.int32)
        cv2.fillPoly(img, [cap], (245, 245, 245), cv2.LINE_AA)
    # Grass on both sides of the road: mown stripes, then thousands of short blades
    # a little lighter or darker than the grass, so it has a real texture.
    img[HORIZON:, :] = (88, 168, 104)
    lab[HORIZON:, :] = GRASS
    for y in range(HORIZON, H, 6):
        shade = 6 if (y // 6) % 2 else -4
        img[y:y + 3, :] = np.clip(img[y:y + 3, :].astype(int) + shade, 0, 255)
    for _ in range(7000):
        x, y = int(rng.integers(0, W)), int(rng.integers(HORIZON + 4, H))
        length = 2 + (y - HORIZON) // 40
        d = int(rng.integers(-45, 46))
        colour = tuple(int(np.clip(c + d, 0, 255)) for c in (78, 160, 98))
        cv2.line(img, (x, y), (x + int(rng.integers(-2, 3)), y - length), colour, 1)
    # City buildings on the left, with grids of windows (lots of corners).
    for x1, top, x2, colour in ((20, 150, 120, (170, 180, 190)), (130, 110, 230, (150, 160, 176)),
                                (240, 175, 330, (186, 196, 206)), (338, 210, 400, (160, 150, 140))):
        paint(cv2.rectangle, [(x1, top), (x2, HORIZON + 8)], colour, BUILDING, -1)
        for fy in range(top + 8, HORIZON, 30):  # a faint line at each floor
            cv2.line(img, (x1 + 2, fy), (x2 - 2, fy), tuple(c - 12 for c in colour), 1)
        cv2.rectangle(img, (x1, top), (x2, HORIZON + 8), (90, 90, 96), 2)
        for wy in range(top + 14, HORIZON - 4, 30):
            for wx in range(x1 + 12, x2 - 14, 26):
                cv2.rectangle(img, (wx, wy), (wx + 12, wy + 16), (110, 70, 40), -1)
    # The road, narrowing towards the horizon.
    road = np.array([[40, H], [440, HORIZON + 10], [520, HORIZON + 10], [920, H]], np.int32)
    mask = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mask, [road], 255)
    # Asphalt: large soft patches (worn and repaired areas) plus small stones.
    patches = cv2.resize(rng.normal(0, 1, (H // 24, W // 24)), (W, H), interpolation=cv2.INTER_CUBIC)
    stones = np.zeros((H, W))
    for _ in range(9000):
        cv2.circle(stones, (int(rng.integers(0, W)), int(rng.integers(HORIZON, H))), 1, float(rng.normal(0, 30)), -1)
    asphalt = np.full((H, W), 94.0) + 5 * patches + stones
    asphalt = np.clip(np.repeat(asphalt[:, :, None], 3, axis=2) + (0, 0, 3), 0, 255).astype(np.uint8)
    img[mask > 0] = asphalt[mask > 0]
    lab[mask > 0] = ROAD
    # Painted edge lines and a dashed centre line.
    paint(cv2.line, [(70, H), (446, HORIZON + 12)], (240, 240, 240), LANE, 6, cv2.LINE_AA)
    paint(cv2.line, [(890, H), (514, HORIZON + 12)], (240, 240, 240), LANE, 6, cv2.LINE_AA)
    for k in range(9):
        t1, t2 = (k + 0.15) / 9, (k + 0.6) / 9
        y1, y2 = int(H - (H - HORIZON - 14) * t1), int(H - (H - HORIZON - 14) * t2)
        w1, w2 = max(2, int(10 * (1 - t1))), max(2, int(10 * (1 - t2)))
        dash = np.array([[480 - w1, y1], [480 - w2, y2], [480 + w2, y2], [480 + w1, y1]], np.int32)
        paint(cv2.fillPoly, [[dash]], (70, 210, 240), LANE, cv2.LINE_AA)
    # A car ahead in the right lane, with a soft shadow under it.
    shadow = np.zeros((H, W), np.uint8)
    cv2.ellipse(shadow, (612, 462), (78, 12), 0, 0, 360, 255, -1)
    shadow = cv2.GaussianBlur(shadow, (0, 0), 4)[:, :, None] / 255.0
    img[:] = (img * (1 - 0.55 * shadow)).astype(np.uint8)
    paint(cv2.rectangle, [(548, 392), (676, 446)], (60, 60, 200), CAR, -1, cv2.LINE_AA)
    paint(cv2.rectangle, [(568, 364), (656, 394)], (50, 50, 170), CAR, -1, cv2.LINE_AA)
    cv2.rectangle(img, (576, 370), (648, 390), (220, 200, 170), -1)
    cv2.rectangle(img, (556, 404), (580, 414), (80, 220, 250), -1)
    cv2.rectangle(img, (644, 404), (668, 414), (80, 220, 250), -1)
    cv2.rectangle(img, (596, 422), (628, 432), (235, 235, 235), -1)
    for wx in (566, 658):
        paint(cv2.rectangle, [(wx - 12, 444), (wx + 12, 462)], (30, 30, 30), CAR, -1)
    # A house and a tree on the right.
    paint(cv2.rectangle, [(742, 236), (842, 312)], (120, 170, 220), BUILDING, -1)
    paint(cv2.fillPoly, [[np.array([[730, 238], [792, 192], [854, 238]], np.int32)]], (60, 60, 160), BUILDING, cv2.LINE_AA)
    cv2.rectangle(img, (782, 266), (804, 312), (50, 80, 110), -1)
    cv2.rectangle(img, (754, 252), (774, 270), (245, 235, 220), -1)
    cv2.rectangle(img, (812, 252), (832, 270), (245, 235, 220), -1)
    paint(cv2.rectangle, [(896, 250), (906, 318)], (40, 70, 100), TREE, -1)
    for cx, cy, r in ((900, 228, 28), (884, 244, 20), (918, 246, 20)):
        paint(cv2.circle, [(cx, cy), r], (60, 130, 60), TREE, -1, cv2.LINE_AA)
    # A stop sign at the roadside.
    paint(cv2.line, [(700, 330), (700, 430)], (120, 120, 120), SIGN, 5)
    octagon = np.array([[700 + 30 * np.cos(np.pi / 8 + k * np.pi / 4), 314 + 30 * np.sin(np.pi / 8 + k * np.pi / 4)]
                        for k in range(8)], np.int32)
    paint(cv2.fillPoly, [[octagon]], (40, 40, 210), SIGN, cv2.LINE_AA)
    cv2.polylines(img, [octagon], True, (245, 245, 245), 2, cv2.LINE_AA)
    cv2.putText(img, "STOP", (680, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (250, 250, 250), 2, cv2.LINE_AA)
    # A person crossing on the left side of the road.
    paint(cv2.circle, [(400, 352), 8], (60, 90, 140), PERSON, -1, cv2.LINE_AA)
    paint(cv2.line, [(400, 360), (400, 392)], (150, 60, 40), PERSON, 6, cv2.LINE_AA)
    paint(cv2.line, [(400, 392), (392, 414)], (50, 40, 30), PERSON, 4, cv2.LINE_AA)
    paint(cv2.line, [(400, 392), (408, 414)], (50, 40, 30), PERSON, 4, cv2.LINE_AA)
    paint(cv2.line, [(400, 368), (390, 386)], (150, 60, 40), PERSON, 3, cv2.LINE_AA)
    paint(cv2.line, [(400, 368), (410, 386)], (150, 60, 40), PERSON, 3, cv2.LINE_AA)
    return img, lab


# Where each object is in street.png, for the detection pictures (these boxes come
# from the drawing above, not from a detector).
OBJECTS = {"car": (544, 360, 680, 464), "stop sign": (668, 282, 732, 432), "person": (384, 342, 416, 416),
           "house": (728, 190, 856, 314)}

street, labels = draw_street()
save("street.png", street)

# The challenge image: dark, flat and noisy.
poor = cv2.resize(street, (640, 360), interpolation=cv2.INTER_AREA)
poor = cv2.convertScaleAbs(poor, alpha=0.45, beta=12)
grain = rng.normal(0, 7, poor.shape[:2] + (1,)).astype(np.int16)  # grey sensor noise
poor = np.clip(poor.astype(np.int16) + grain, 0, 255).astype(np.uint8)
dots = rng.random(poor.shape[:2])
poor[dots < 0.01] = 0
poor[dots > 0.99] = 255
save("poor-street.png", poor)

# The noise lesson's image: street.png at 640 x 360 with salt-and-pepper noise,
# 4% of the pixels turned pure black or pure white.
noisy = cv2.resize(street, (640, 360), interpolation=cv2.INTER_AREA)
dots = rng.random(noisy.shape[:2])
noisy[dots < 0.02] = 0
noisy[dots > 0.98] = 255
save("noisy-street.png", noisy)


# Two views of the street, as if the camera moved to the right and turned a little.
def view(img, shift, tilt):
    src = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    dst = np.float32([[-shift + tilt, 0], [W - shift - tilt, 6], [W - shift, H], [-shift, H - 4]])
    m = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(img, m, (W, H), borderMode=cv2.BORDER_REPLICATE)
    return warped[:, 60:780]


save("view-a.png", view(street, 0, 0))
save("view-b.png", view(street, 70, 14))


# ---------------------------------------------------------------------------
# 2. Result pictures: run the lecture programs and lay out what they show
# ---------------------------------------------------------------------------
NAVY, PANEL, INK, MUTED = (20, 33, 61), (32, 49, 86), (242, 245, 250), (154, 164, 178)
YELLOW, SKY, CORAL, GREEN = (255, 212, 59), (140, 196, 242), (255, 138, 122), (95, 211, 154)
ORANGE, RED = (255, 165, 79), (255, 90, 79)
TITLE_BAR, FRAME, DARK = (233, 237, 243), (154, 164, 178), (34, 40, 52)
FONT_DIR = pathlib.Path(os.environ.get("FONT_DIR", "/usr/share/fonts/truetype"))
POPPINS = ROOT / "node_modules" / "@fontsource" / "poppins" / "files"


def font_file(name):
    for found in FONT_DIR.rglob(name):
        return str(found)
    raise SystemExit("font not found: %s (set FONT_DIR)" % name)


def font(size, weight=600):
    poppins = POPPINS / ("poppins-latin-%d-normal.woff" % weight)
    if poppins.exists():
        return ImageFont.truetype(str(poppins), size)
    return ImageFont.truetype(font_file("DejaVuSans-Bold.ttf" if weight >= 600 else "DejaVuSans.ttf"), size)


UI = ImageFont.truetype(font_file("DejaVuSans.ttf"), 15)
MONO = ImageFont.truetype(font_file("DejaVuSansMono-Bold.ttf"), 17)
CAPTION, SUB, HEAD = font(21, 600), font(17, 400), font(24, 700)


def pil(img):
    if img.ndim == 2:
        return Image.fromarray(img).convert("RGB")
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))


def shrink(img, width):
    """An OpenCV image resized to `width` (keeping its ratio), area-averaged like a screen would."""
    height = round(img.shape[0] * width / img.shape[1])
    return cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA if width < img.shape[1] else cv2.INTER_NEAREST)


def zoom(img, k):
    return cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_NEAREST)


def window(img, title, width=None):
    """What cv2.imshow shows: the image under a title bar (drawn smaller when `width` is given)."""
    im = pil(shrink(img, width) if width else img)
    bar = 30
    out = Image.new("RGB", (im.width + 2, im.height + bar + 1), FRAME)
    d = ImageDraw.Draw(out)
    d.rectangle([1, 1, im.width, bar - 1], fill=TITLE_BAR)
    d.text((12, bar // 2), title, font=UI, fill=DARK, anchor="lm")
    out.paste(im, (1, bar))
    return out


def sheet(cells, cols=None, gap=28, pad=28, header=None, arrows=False):
    """Lays out (picture, caption, sub-caption) cells in a grid on navy. Captions may be None."""
    cells = [c if isinstance(c, tuple) else (c, None, None) for c in cells]
    cells = [(c[0] if isinstance(c[0], Image.Image) else pil(c[0]), *(list(c[1:]) + [None, None])[:2]) for c in cells]
    cols = cols or len(cells)
    rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
    gap_x = 64 if arrows else gap
    col_w = [max(r[i][0].width for r in rows if i < len(r)) for i in range(cols)]
    cap_h = 34 if any(c[1] for c in cells) else 0
    sub_h = 26 if any(c[2] for c in cells) else 0
    row_h = [max(c[0].height for c in r) + cap_h + sub_h for r in rows]
    head_h = 46 if header else 0
    width = pad * 2 + sum(col_w) + gap_x * (cols - 1)
    height = pad * 2 + head_h + sum(row_h) + gap * (len(rows) - 1)
    out = Image.new("RGB", (width, height), NAVY)
    d = ImageDraw.Draw(out)
    if header:
        d.text((pad, pad + 14), header, font=HEAD, fill=YELLOW, anchor="lm")
    y = pad + head_h
    for r, h in zip(rows, row_h):
        x = pad
        img_h = h - cap_h - sub_h
        for i, (im, cap, sub) in enumerate(r):
            cx = x + col_w[i] // 2
            out.paste(im, (cx - im.width // 2, y + (img_h - im.height) // 2))
            if cap:
                d.text((cx, y + img_h + 8), cap, font=CAPTION, fill=INK, anchor="mt")
            if sub:
                d.text((cx, y + img_h + cap_h + 6), sub, font=SUB, fill=MUTED, anchor="mt")
            if arrows and i < len(r) - 1:
                ax, ay = x + col_w[i] + 12, y + img_h // 2
                d.line([(ax, ay), (ax + gap_x - 30, ay)], fill=YELLOW, width=4)
                d.polygon([(ax + gap_x - 24, ay), (ax + gap_x - 36, ay - 9), (ax + gap_x - 36, ay + 9)], fill=YELLOW)
            x += col_w[i] + gap_x
        y += h + gap
    return out


def stack(*images):
    width = max(im.width for im in images)
    out = Image.new("RGB", (width, sum(im.height for im in images)), NAVY)
    y = 0
    for im in images:
        out.paste(im, (0, y))
        y += im.height
    return out


def card(size, lines, highlight=None):
    """A panel with text chips, for the decision parts of the diagrams."""
    w, h = size
    out = Image.new("RGB", (w, h), PANEL)
    d = ImageDraw.Draw(out)
    step = h / (len(lines) + 1)
    chip = min(19, step / 2 - 4)
    for k, text in enumerate(lines):
        on = text == highlight
        cy = step * (k + 1)
        tw = d.textlength(text, font=SUB) + 32
        d.rounded_rectangle([w / 2 - tw / 2, cy - chip, w / 2 + tw / 2, cy + chip], radius=chip,
                            fill=YELLOW if on else NAVY, outline=YELLOW if on else MUTED, width=2)
        d.text((w / 2, cy), text, font=SUB, fill=NAVY if on else INK, anchor="mm")
    return out


def save_pic(name, im):
    im.save(OUT / name, optimize=True)
    print("wrote %-28s %5d x %-4d %6.0f KB" % (name, im.width, im.height, (OUT / name).stat().st_size / 1024))


def program_of(lesson, section):
    """The ```python program block of '## [code] <section>' in a lecture file."""
    text = next(LESSONS.glob("*-%s.md" % lesson)).read_text(encoding="utf8")
    parts = re.split(r"^## \[(\w+)\] (.+)$", text, flags=re.M)
    for i in range(1, len(parts), 3):
        if parts[i + 1].strip() == section:
            m = re.search(r"^```python program[^\n]*\n(.*?)^```", parts[i + 2], flags=re.M | re.S)
            if m:
                return m.group(1)
    raise SystemExit("no program in %s > %s" % (lesson, section))


def run_code(code, titles=None):
    """Runs a program like the checker does; returns what it printed and every cv2.imshow window."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        for name in ("street.png", "noisy-street.png", "poor-street.png", "view-a.png", "view-b.png"):
            shutil.copy(OUT / name, tmp / name)
        (tmp / "main.py").write_text(code, encoding="utf8")
        (tmp / "shown").mkdir()
        env = dict(os.environ, CODELAB_SHOW_DIR=str(tmp / "shown"))
        done = subprocess.run([sys.executable, "-I", str(RUNNER), "main.py"], cwd=tmp, env=env,
                              capture_output=True, text=True)
        if done.returncode != 0:
            raise SystemExit(done.stderr)
        titles = titles or re.findall(r'cv2\.imshow\(\s*"([^"]*)"', code)
        shown = [(titles[i % len(titles)], cv2.imread(str(f), cv2.IMREAD_UNCHANGED))
                 for i, f in enumerate(sorted((tmp / "shown").glob("*.png")))]
        return done.stdout, shown


def run(lesson, section):
    return run_code(program_of(lesson, section))


def same(a, b, what):
    if not np.array_equal(a, b):
        raise SystemExit("picture code no longer matches the lecture: " + what)


def edge_view(edges, width, boost=3):
    """Thin white edges stay visible when drawn smaller."""
    return np.clip(shrink(edges, width).astype(np.int32) * boost, 0, 255).astype(np.uint8)


def number(stdout, label):
    m = re.search(re.escape(label) + r"\s*([\d.]+)", stdout)
    if not m:
        raise SystemExit("no %r in the output" % label)
    return m.group(1)


gray = cv2.cvtColor(street, cv2.COLOR_BGR2GRAY)
SEG_COLOURS = [(140, 196, 242), (122, 130, 150), (255, 138, 122), (95, 211, 154), (74, 85, 104),
               (250, 250, 250), (255, 212, 59), (46, 139, 87), (232, 69, 60), (176, 124, 255)]


def boxes(im, scale, items, colour=YELLOW):
    d = ImageDraw.Draw(im)
    for label, (x1, y1, x2, y2) in items:
        box = [round(v * scale) for v in (x1, y1, x2, y2)]
        d.rectangle(box, outline=colour, width=3)
        tw = d.textlength(label, font=SUB) + 12
        d.rectangle([box[0], box[1] - 24, box[0] + tw, box[1]], fill=colour)
        d.text((box[0] + 6, box[1] - 12), label, font=SUB, fill=NAVY, anchor="lm")
    return im


# Lecture 1 --------------------------------------------------------------------
g = cv2.imread(str(OUT / "street.png"), cv2.IMREAD_GRAYSCALE)  # as the lecture's program reads it
r0, c0, n = 161, 29, 6
thumb = pil(shrink(street, 480))
ImageDraw.Draw(thumb).rectangle([c0 / 2 - 7, r0 / 2 - 7, (c0 + n) / 2 + 7, (r0 + n) / 2 + 7], outline=YELLOW, width=3)
pixels = pil(zoom(street[r0:r0 + n, c0:c0 + n], 44))
d = ImageDraw.Draw(pixels)
for k in range(1, n):
    d.line([(k * 44, 0), (k * 44, n * 44)], fill=NAVY, width=2)
    d.line([(0, k * 44), (n * 44, k * 44)], fill=NAVY, width=2)
numbers = Image.new("RGB", (n * 44, n * 44), NAVY)
d = ImageDraw.Draw(numbers)
for i in range(n):
    for j in range(n):
        v = int(g[r0 + i, c0 + j])
        d.rectangle([j * 44 + 1, i * 44 + 1, j * 44 + 42, i * 44 + 42], fill=(v, v, v))
        d.text((j * 44 + 22, i * 44 + 22), str(v), font=MONO, fill=NAVY if v > 120 else INK, anchor="mm")
save_pic("cv-computer-sees.png", sheet([(thumb, "Real image", "street.png"), (pixels, "Pixels", "6 × 6, enlarged"),
                                        (numbers, "Numerical values", "grey value of each pixel")], arrows=True))

edges_small = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 50, 150)
analysis = pil(edge_view(edges_small, 240))
boxes(analysis, 0.25, [("car", OBJECTS["car"])])
save_pic("cv-pipeline.png", sheet([
    (pil(shrink(street, 240)), "1. Image", "acquisition"),
    (pil(shrink(gray, 240)), "2. Image", "processing"),
    (pil(edge_view(edges_small, 240)), "3. Feature", "extraction"),
    (analysis, "4. Analysis", "edges show a car"),
    (card((240, 135), ["Slow down"], "Slow down"), "5. Decision", "act on it"),
], arrows=True))

x1, y1, x2, y2 = OBJECTS["car"]
car = pil(cv2.resize(street[y1 - 20:y2 + 20, x1 - 20:x2 + 20], None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC))
d = ImageDraw.Draw(car)
d.rounded_rectangle([car.width / 2 - 50, car.height - 46, car.width / 2 + 50, car.height - 10], radius=18, fill=YELLOW)
d.text((car.width / 2, car.height - 28), "car", font=CAPTION, fill=NAVY, anchor="mm")
detect = boxes(pil(shrink(street, 480)), 0.5, [("car", OBJECTS["car"]), ("person", OBJECTS["person"]),
                                              ("stop sign", OBJECTS["stop sign"])])
seg = np.array(SEG_COLOURS, np.uint8)[labels]
seg = (0.8 * seg + 0.2 * cv2.cvtColor(street, cv2.COLOR_BGR2RGB)).astype(np.uint8)
seg_im = Image.fromarray(cv2.resize(seg, (480, 270), interpolation=cv2.INTER_AREA))
key = Image.new("RGB", (480, 64), NAVY)
d = ImageDraw.Draw(key)
for k, name in enumerate(CLASSES):
    x, y = (k % 5) * 96, (k // 5) * 32
    d.rectangle([x, y + 8, x + 16, y + 24], fill=SEG_COLOURS[k])
    d.text((x + 22, y + 16), name, font=font(14, 400), fill=INK, anchor="lm")
seg_panel = Image.new("RGB", (480, 270 + 72), NAVY)
seg_panel.paste(seg_im, (0, 0))
seg_panel.paste(key, (0, 278))
save_pic("cv-tasks.png", sheet([(car, "Image classification", "one label for the image"),
                                (detect, "Object detection", "a label and a box per object"),
                                (seg_panel, "Image segmentation", "a label for every pixel")]))

road = cv2.cvtColor(street, cv2.COLOR_BGR2RGB)
road[labels == LANE] = SKY
road_im = boxes(Image.fromarray(road), 1, [("car", OBJECTS["car"]), ("pedestrian", OBJECTS["person"]),
                                           ("traffic sign", OBJECTS["stop sign"])])
d = ImageDraw.Draw(road_im)
d.rectangle([150, 470, 270, 496], fill=SKY)
d.text((210, 483), "lane lines", font=SUB, fill=NAVY, anchor="mm")
save_pic("cv-road-understanding.png", sheet([road_im]))

# Lecture 2 --------------------------------------------------------------------
out, shown = run("reading-and-showing-images", "Step 1: read and show an image")
save_pic("cv-window-original.png", sheet([window(img, t) for t, img in shown]))

out, shown = run("grayscale-images", "Step 3: convert to grayscale")
save_pic("cv-grayscale.png", sheet([window(img, t, 560) for t, img in shown]))

out, shown = run("resizing-images", "Step 4: resize to 640 × 480")
same(shown[0][1], cv2.resize(street, (640, 480)), "resize")
ratio = cv2.resize(street, (640, 360), interpolation=cv2.INTER_AREA)
save_pic("cv-resize.png", sheet([(shrink(street, 480), "Original", "960 × 540"),
                                 (shrink(shown[0][1], 320), "Resized", "640 × 480: squeezed"),
                                 (shrink(ratio, 320), "Keeping the ratio", "640 × 360")]))

out, shown = run("brightness-and-contrast", "Step 5: make the image brighter")
same(shown[1][1], cv2.convertScaleAbs(street, alpha=1, beta=50), "brightness")
save_pic("cv-beta.png", sheet([(shrink(cv2.convertScaleAbs(street, alpha=1, beta=-50), 480), "beta = -50", "darker"),
                               (shrink(street, 480), "beta = 0", "original"),
                               (shrink(shown[1][1], 480), "beta = +50", "brighter")]))
save_pic("cv-alpha.png", sheet([(shrink(cv2.convertScaleAbs(street, alpha=0.5, beta=0), 480), "alpha = 0.5", "low contrast"),
                                (shrink(street, 480), "alpha = 1", "original"),
                                (shrink(cv2.convertScaleAbs(street, alpha=2, beta=0), 480), "alpha = 2", "high contrast")]))
cells = []
for a in (0.5, 1, 1.5, 2):
    for b in (-50, 0, 50, 100):
        cells.append((shrink(cv2.convertScaleAbs(street, alpha=a, beta=b), 240), "alpha %s, beta %s" % (a, b)))
grid = sheet(cells, cols=4, gap=18)
save_pic("cv-alpha-beta.png", grid)

out, shown = run("smoothing-and-noise", "Step 7: a Gaussian blur")
same(shown[1][1], cv2.GaussianBlur(street, (5, 5), 0), "Gaussian blur")
crop = (slice(100, 330), slice(10, 410))
save_pic("cv-gaussian-sizes.png", sheet(
    [(cv2.resize(street[crop], None, fx=1.2, fy=1.2, interpolation=cv2.INTER_CUBIC), "Original")] +
    [(cv2.resize(cv2.GaussianBlur(street, (k, k), 0)[crop], None, fx=1.2, fy=1.2, interpolation=cv2.INTER_CUBIC),
      "(%d, %d)" % (k, k)) for k in (3, 5, 15)], cols=2))

out, shown = run("smoothing-and-noise", "Removing salt and pepper with a median blur")
save_pic("cv-median.png", sheet([window(img, t) for t, img in shown]))
out, _ = run("smoothing-and-noise", "Which filter helps most?")
crop = (slice(60, 240), slice(0, 320))
filters = [("noisy", noisy), ("average", cv2.blur(noisy, (5, 5))), ("gaussian", cv2.GaussianBlur(noisy, (5, 5), 0)),
           ("median", cv2.medianBlur(noisy, 5))]
save_pic("cv-filters.png", sheet([(zoom(img[crop], 1.5), name.capitalize(), "average error " + number(out, name + " "))
                                  for name, img in filters], cols=2))

out, shown = run("sharpening-images", "Step 9: sharpen the image")
sharp = shown[1][1]
parts = [(slice(100, 300), slice(120, 360)), (slice(290, 470), slice(520, 740))]
save_pic("cv-sharpen.png", sheet([(zoom(img[c], 2), name) for c in parts
                                  for name, img in (("Original", street), ("Sharpened", sharp))], cols=2))


def histogram(img, width=480, height=150):
    counts = np.bincount(img.ravel(), minlength=256).astype(float)
    out = Image.new("RGB", (width, height + 28), PANEL)
    d = ImageDraw.Draw(out)
    top = counts.max()
    for v in range(256):
        x = 10 + v * (width - 20) / 255
        d.line([(x, height - 4), (x, height - 4 - (height - 16) * counts[v] / top)], fill=SKY, width=2)
    for v, anchor in ((0, "lm"), (128, "mm"), (255, "rm")):
        d.text((10 + v * (width - 20) / 255, height + 12), str(v), font=font(14, 400), fill=MUTED, anchor=anchor)
    return out


out, shown = run("histogram-equalization", "Step 10: histogram equalization")
cols = []
for (title, img), line in zip(shown, out.splitlines()):
    panel = Image.new("RGB", (482, 271 + 31 + 12 + 178), NAVY)
    panel.paste(window(img, title, 480), (0, 0))
    panel.paste(histogram(img), (1, 271 + 31 + 12))
    cols.append((panel, line.capitalize(), "darkest to brightest grey"))
save_pic("cv-equalize.png", sheet(cols))

out, shown = run("enhancement-pipeline-and-challenge", "A small enhancement pipeline")
p_gray = cv2.cvtColor(street, cv2.COLOR_BGR2GRAY)
p_res = cv2.resize(p_gray, (640, 480))
p_blur = cv2.GaussianBlur(p_res, (5, 5), 0)
same(shown[1][1], cv2.equalizeHist(p_blur), "pipeline")
save_pic("cv-pipeline-stages.png", sheet([
    (shrink(street, 240), "Image"), (shrink(p_gray, 240), "Grayscale"), (shrink(p_res, 180), "Resize"),
    (shrink(p_blur, 180), "Denoise"), (shrink(shown[1][1], 180), "Enhance contrast"),
    (window(shown[1][1], "Enhanced", 180), "Result")], arrows=True))
out, shown = run("enhancement-pipeline-and-challenge", "One possible solution")
save_pic("cv-challenge.png", sheet([window(shown[0][1], shown[0][0], 1100)]))

# Lecture 3 --------------------------------------------------------------------
def patch(y, x, size=24, k=10):
    return zoom(street[y - size // 2:y + size // 2, x - size // 2:x + size // 2], k)


save_pic("cv-flat-edge-corner.png", sheet([(patch(40, 300), "Flat region", "hard to find again"),
                                           (patch(420, 268), "Edge", "ambiguous along the line"),
                                           (patch(166, 34), "Corner", "easy to find again")]))

e100 = cv2.Canny(gray, 100, 200)
blend = (shrink(e100, 576)[:, :, None] / 255.0 * 3).clip(0, 1)
edges_im = (np.array(NAVY) * (1 - blend) + np.array(SKY) * blend).astype(np.uint8)
corner_pts = cv2.goodFeaturesToTrack(gray, maxCorners=100, qualityLevel=0.01, minDistance=10)
dots = pil(shrink(street, 576))
d = ImageDraw.Draw(dots)
for x, y in np.int32(corner_pts).reshape(-1, 2) * 0.6:
    d.ellipse([x - 3.5, y - 3.5, x + 3.5, y + 3.5], fill=(255, 40, 40))
save_pic("cv-edges-vs-corners.png", sheet([(Image.fromarray(edges_im), "Edges", "Canny 100, 200"),
                                           (dots, "Corners", "Shi-Tomasi, the strongest 100")]))

out, shown = run("features-and-edges", "Finding edges with OpenCV")
same(shown[1][1], e100, "Canny")
save_pic("cv-canny.png", sheet([window(img, t, 600) for t, img in shown]))
out, _ = run("features-and-edges", "Experiment: change the thresholds")
crop = (slice(270, 540), slice(240, 720))
save_pic("cv-canny-thresholds.png", sheet([(cv2.Canny(gray, lo, hi)[crop], "%d, %d" % (lo, hi),
                                            "%s%% of the image" % number(out, "%d %d" % (lo, hi)))
                                           for lo, hi in ((50, 100), (100, 200), (150, 250))]))

out, shown = run("finding-corners", "Drawing the corners")
save_pic("cv-corners.png", sheet([window(img, t) for t, img in shown]))

out, shown = run("orb-keypoints-and-descriptors", "Detecting keypoints with ORB")
save_pic("cv-orb.png", sheet([window(img, t) for t, img in shown]))
out, _ = run("orb-keypoints-and-descriptors", "Inside one keypoint and its descriptor")
kps, des = cv2.ORB_create().detectAndCompute(gray, None)
kp = kps[0]
x, y = (int(round(v)) for v in kp.pt)
k = 5
close = pil(zoom(street[y - 32:y + 32, x - 32:x + 32], k))
d = ImageDraw.Draw(close)
c = 32 * k + k // 2
rad = kp.size / 2 * k
d.ellipse([c - rad, c - rad, c + rad, c + rad], outline=YELLOW, width=4)
a = np.deg2rad(kp.angle)
d.line([(c, c), (c + rad * np.cos(a), c + rad * np.sin(a))], fill=YELLOW, width=4)
d.ellipse([c - 6, c - 6, c + 6, c + 6], fill=YELLOW)
bits = np.unpackbits(des[0]).reshape(16, 16)
grid = Image.new("RGB", (320, 320), NAVY)
d = ImageDraw.Draw(grid)
for i in range(16):
    for j in range(16):
        d.rectangle([j * 20 + 1, i * 20 + 1, j * 20 + 19, i * 20 + 19], fill=INK if bits[i, j] else (8, 14, 30))
d.rectangle([0, 0, 319, 20], outline=YELLOW, width=2)
save_pic("cv-keypoint.png", sheet([
    (close, "keypoints[0]", "(%d, %d) · size %d · angle %s°" % (x, y, kp.size, number(out, "angle:"))),
    (grid, "descriptors[0]: 256 bits", "first row: " + " ".join(map(str, bits[0])))]))

out, shown = run("feature-matching", "Feature matching with ORB")
save_pic("cv-matches.png", sheet([window(shown[0][1], shown[0][0], 1200)]))

out, _ = run("feature-matching", "Try it: how much does motion blur hurt?")
img1, img2 = cv2.imread(str(OUT / "view-a.png"), 0), cv2.imread(str(OUT / "view-b.png"), 0)
orb, bf = cv2.ORB_create(), cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
des1 = orb.detectAndCompute(img1, None)[1]


def good_matches(b):
    des2 = orb.detectAndCompute(b, None)[1]
    return 0 if des2 is None else sum(1 for m in bf.match(des1, des2) if m.distance < 40)


h2, w2 = img2.shape
pix = cv2.resize(cv2.resize(img2, (w2 // 4, h2 // 4), interpolation=cv2.INTER_AREA), (w2, h2), interpolation=cv2.INTER_NEAREST)
hidden = img2.copy()
hidden[:, :w2 // 2] = 128
variants = [
    ("Normal", img2),
    ("Darker", cv2.convertScaleAbs(img2, alpha=0.5, beta=0)),
    ("Uneven lighting", (img2 * np.linspace(0.3, 1.0, w2)[None, :]).astype(np.uint8)),
    ("Different angle", view(gray, 70, 90)),
    ("Motion blur", cv2.filter2D(img2, -1, np.ones((1, 15)) / 15)),
    ("Occlusion", hidden),
    ("Poor quality", np.clip(pix + np.random.default_rng(7).normal(0, 12, pix.shape), 0, 255).astype(np.uint8)),
    ("Quarter size", cv2.resize(img2, (w2 // 4, h2 // 4), interpolation=cv2.INTER_AREA)),
]
counts = {name: good_matches(b) for name, b in variants}
if counts["Normal"] != int(number(out, "normal")) or counts["Motion blur"] != int(number(out, "motion blur")):
    raise SystemExit("matching counts differ from the lecture program: %s" % counts)
print("good matches:", counts)
cells = []
for name, b in variants:
    cell = Image.new("RGB", (360, 270), PANEL)
    small = pil(cv2.resize(b, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
    cell.paste(small, ((360 - small.width) // 2, (270 - small.height) // 2))
    cells.append((cell, name, "%d good matches" % counts[name]))
save_pic("cv-match-difficulty.png", sheet(cells, cols=4, gap=20))

frames_code = '''import cv2

cap = cv2.VideoCapture(0)
for i in range(4):
    ret, frame = cap.read()
    cv2.imshow("frame", frame)
cap.release()
'''
_, frames = run_code(frames_code)
save_pic("cv-frames.png", sheet([(shrink(f, 320), "Frame %d" % (i + 1)) for i, (_, f) in enumerate(frames)], gap=18))

stages_code = '''import cv2
import numpy as np

cap = cv2.VideoCapture(0)
ret, frame = cap.read()
resized = cv2.resize(frame, (640, 480))
gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blur, 50, 150)
for image in (frame, resized, gray, blur, edges):
    cv2.imshow("stage", image)
print(round(np.count_nonzero(edges) / edges.size * 100, 1))
cap.release()
'''
out, stages = run_code(stages_code)
frame1, f_res, f_gray, f_blur, f_edges = (img for _, img in stages)
save_pic("cv-live-stages.png", sheet([
    (shrink(frame1, 320), "Frame", "960 × 540"), (shrink(f_res, 240), "Resize", "640 × 480"),
    (shrink(f_gray, 240), "Grayscale", "1 channel"), (shrink(f_blur, 240), "Gaussian blur", "(5, 5)"),
    (edge_view(f_edges, 240), "Canny edges", "%s%% edge pixels" % out.strip())], arrows=True))

out, shown = run("live-camera-pipeline", "Build the live processing pipeline")
same(shown[2][1], f_edges, "live pipeline")
save_pic("cv-live-windows.png", sheet([window(img, t, 420) for t, img in shown[:3]]))

# What each edge of the first frame belongs to, from the drawing's label map.
f_lab = cv2.resize(cv2.resize(labels[:, 0:920], (960, 540), interpolation=cv2.INTER_NEAREST), (640, 480),
                   interpolation=cv2.INTER_NEAREST)
near = {c: cv2.dilate((f_lab == c).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0 for c in range(len(CLASSES))}
meaning = np.zeros((480, 640, 3), np.uint8)
meaning[:] = (8, 14, 30)
on = f_edges > 0
groups = [("lane lines", near[LANE], SKY), ("vehicle", near[CAR], ORANGE), ("sign", near[SIGN], RED),
          ("road edge", near[ROAD] & near[GRASS], GREEN)]
taken = np.zeros_like(on)
for _, where, colour in groups:
    pick = on & where & ~taken
    meaning[pick] = colour
    taken |= pick
meaning[on & ~taken] = MUTED
legend = Image.new("RGB", (960, 40), NAVY)
d = ImageDraw.Draw(legend)
for k, (name, colour) in enumerate([(g_[0], g_[2]) for g_ in groups] + [("other edges", MUTED)]):
    d.rectangle([k * 190, 12, k * 190 + 18, 30], fill=colour)
    d.text((k * 190 + 26, 21), name, font=SUB, fill=INK, anchor="lm")
save_pic("cv-edges-meaning.png", sheet([stack(Image.fromarray(zoom(meaning, 1.5)), Image.new("RGB", (960, 12), NAVY), legend)]))

out, _ = run("live-camera-pipeline", "Experiment: improve your vision pipeline")
t_gray = cv2.cvtColor(cv2.resize(street, (640, 480)), cv2.COLOR_BGR2GRAY)
crop = (slice(200, 440), slice(200, 520))
lines = out.splitlines()


def tuned(blur_size, low, high, line):
    e = cv2.Canny(cv2.GaussianBlur(t_gray, (blur_size, blur_size), 0), low, high)
    return zoom(e[crop], 1.25), line.strip().rsplit(" ", 2)[-2] + "% edges"


top = sheet([(img, "Canny %d, %d" % (lo, hi), pct) for (lo, hi), line in zip(((50, 100), (50, 150), (100, 200)), lines[1:4])
             for img, pct in [tuned(5, lo, hi, line)]], header="Blur fixed at (5, 5)")
bottom = sheet([(img, "Blur (%d, %d)" % (k_, k_), pct) for k_, line in zip((3, 5, 9), lines[5:8])
                for img, pct in [tuned(k_, 50, 150, line)]], header="Canny fixed at 50, 150")
save_pic("cv-live-experiments.png", stack(top, bottom))

roi = np.zeros((480, 640), np.uint8)
trapezoid = np.array([[20, 480], [290, 270], [380, 270], [640, 480]], np.int32)
cv2.fillPoly(roi, [trapezoid], 255)
preview = np.dstack([f_edges] * 3).astype(float)
preview[roi == 0] *= 0.3
preview = preview.astype(np.uint8)
shade = preview.copy()
cv2.fillPoly(shade, [trapezoid], (40, 190, 230))
preview = cv2.addWeighted(preview, 0.7, shade, 0.3, 0)
cv2.polylines(preview, [trapezoid], True, (59, 212, 255), 2, cv2.LINE_AA)
save_pic("cv-roi-preview.png", sheet([(zoom(preview, 1.5), "Keep only the road area", "region of interest")]))

see = shrink(street, 300)
understand = cv2.cvtColor(street, cv2.COLOR_BGR2RGB)
understand[labels == LANE] = SKY
understand = boxes(Image.fromarray(shrink(understand, 300)), 300 / 960, [("car", OBJECTS["car"])])
save_pic("cv-see-understand-decide-act.png", sheet([
    (see, "1. SEE", "the camera captures"), (understand, "2. UNDERSTAND", "vision finds lane and car"),
    (card((220, 190), ["Continue", "Turn", "Slow down", "Stop"], "Slow down"), "3. DECIDE", "choose an action"),
    (card((200, 169), ["Motors", "Steering"]), "4. ACT", "the vehicle responds")], arrows=True))
