"""Draws the images used by the Computer Vision lessons (content/computer-vision/images/).

    python3 tools/content-images/make_cv_images.py

The pictures are generated, not photographs, so there are no rights questions and
anyone can recreate them. Colours are the CodeLab palette, given here in BGR order
because that is how OpenCV stores them.
"""
import pathlib

import cv2
import numpy as np

OUT = pathlib.Path(__file__).resolve().parents[2] / "content" / "computer-vision" / "images"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (61, 33, 20)        # #14213D
YELLOW = (59, 212, 255)    # #FFD43B
SKY = (242, 196, 140)      # #8CC4F2
CORAL = (122, 138, 255)    # #FF8A7A
INK = (250, 245, 242)      # #F2F5FA
FONT = cv2.FONT_HERSHEY_SIMPLEX


def save(name, img):
    cv2.imwrite(str(OUT / name), img)
    print("wrote", name, img.shape)


def label(img, text, x, y, scale=0.6, color=INK, thickness=1):
    cv2.putText(img, text, (x, y), FONT, scale, color, thickness, cv2.LINE_AA)


# 1. shapes.png: the image the lessons read with cv2.imread (240 wide, 160 tall).
shapes = np.full((160, 240, 3), NAVY, dtype=np.uint8)
cv2.circle(shapes, (70, 80), 45, YELLOW, -1)
cv2.rectangle(shapes, (135, 35), (210, 125), SKY, -1)
save("shapes.png", shapes)

# 2. pixel-grid.png: a 4x4 patch at the circle's left edge, one big cell per pixel.
y0, x0, n, cell = 78, 23, 4, 132
grid = np.full((n * cell + 2, n * cell + 2, 3), (40, 24, 12), dtype=np.uint8)
for r in range(n):
    for c in range(n):
        b, g, rr = (int(v) for v in shapes[y0 + r, x0 + c])
        top, left = r * cell + 2, c * cell + 2
        grid[top:top + cell - 2, left:left + cell - 2] = (b, g, rr)
        ink = (20, 20, 20) if (int(b) + int(g) + int(rr)) > 380 else INK
        label(grid, f"[{y0 + r},{x0 + c}]", left + 8, top + 26, 0.5, ink)
        for k, (name, v) in enumerate((("B", b), ("G", g), ("R", rr))):
            label(grid, f"{name} {v}", left + 8, top + 60 + k * 26, 0.6, ink, 1)
save("pixel-grid.png", grid)

# 3. bgr-channels.png: the three channels of shapes.png side by side, as grey images.
pad = 36
channels = np.full((160 + pad, 240 * 3 + 20, 3), NAVY, dtype=np.uint8)
for i, name in enumerate(("B (blue)", "G (green)", "R (red)")):
    ch = cv2.cvtColor(shapes[:, :, i], cv2.COLOR_GRAY2BGR)
    channels[pad:, i * 250:i * 250 + 240] = ch
    label(channels, f"channel {i}: {name}", i * 250 + 6, 24, 0.55)
save("bgr-channels.png", channels)

# 4. marked.png: what the "change a block of pixels" example writes.
marked = shapes.copy()
marked[10:30, 10:30] = (255, 255, 255)
save("marked.png", marked)

# 5. scene.png: a dull, low-contrast scene for the brightness and contrast lesson.
h, w = 180, 270
scene = np.zeros((h, w, 3), dtype=np.uint8)
for y in range(h):
    t = y / (h - 1)
    scene[y, :] = (int(120 - 30 * t), int(110 - 20 * t), int(95 + 10 * t))
cv2.rectangle(scene, (0, 130), (w, h), (92, 104, 96), -1)                 # ground
cv2.circle(scene, (205, 50), 24, (120, 140, 150), -1)                     # dim sun
pts = np.array([[30, 130], [95, 60], [160, 130]], dtype=np.int32)
cv2.fillPoly(scene, [pts], (105, 100, 110))                               # hill
cv2.rectangle(scene, (175, 95), (235, 135), (100, 118, 128), -1)          # house
cv2.rectangle(scene, (196, 112), (212, 135), (88, 96, 104), -1)           # door
save("scene.png", scene)

# 6. brightness-contrast.png: before and after convertScaleAbs, with labels.
versions = [
    ("original", scene),
    ("beta=60 (brighter)", cv2.convertScaleAbs(scene, alpha=1.0, beta=60)),
    ("alpha=2.0, beta=-110", cv2.convertScaleAbs(scene, alpha=2.0, beta=-110)),
]
panel = np.full((h + 34, w * 3 + 24, 3), NAVY, dtype=np.uint8)
for i, (name, im) in enumerate(versions):
    panel[34:, i * (w + 12):i * (w + 12) + w] = im
    label(panel, name, i * (w + 12) + 6, 23, 0.55)
save("brightness-contrast.png", panel)

# 7. overflow.png: shapes.png plus 100 with NumPy (wraps around) versus cv2.convertScaleAbs (stops at 255).
sh, sw = shapes.shape[:2]
wrapped = shapes + np.uint8(100)
saturated = cv2.convertScaleAbs(shapes, alpha=1.0, beta=100)
panel = np.full((sh + 34, sw * 3 + 24, 3), NAVY, dtype=np.uint8)
for i, (name, im) in enumerate((("original", shapes), ("img + 100 (wraps)", wrapped), ("convertScaleAbs (stops at 255)", saturated))):
    panel[34:, i * (sw + 12):i * (sw + 12) + sw] = im
    label(panel, name, i * (sw + 12) + 6, 23, 0.5, (INK, CORAL, YELLOW)[i])
save("overflow.png", panel)
