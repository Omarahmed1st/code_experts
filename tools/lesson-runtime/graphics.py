"""A headless stand-in for John Zelle's graphics.py, used only by Code_Expert's tools.

The Python lectures teach Zelle's graphics library (one file, graphics.py, that
students keep next to their programs; it draws with Tkinter). Neither the content
checker nor the site's browser Python has a screen, so this file copies the parts of
the library the lectures use, with the same names, the same errors and the same
rules, and only records what would be drawn:

- the checker (tools/check-lesson-code.ts) runs every graphics program with it, so
  a program that would crash in class (drawing on a closed window, drawing a shape
  twice, a text size the library refuses) fails the check;
- tools/content-images/make_py_graphics.py runs the lecture programs with it and
  turns what was drawn into the window pictures shown in the lectures.

It is not the real library and is never given to students. Behaviour copied from
graphics.py version 5: Point stores its coordinates as floats, shapes copy the
Points they are built from, a new shape has no fill and a black outline, and text
sizes must be from 5 to 36.
"""

GRAPHICS_VERSION = "stand-in for graphics.py 5"

OBJ_ALREADY_DRAWN = "Object currently drawn"
UNSUPPORTED_METHOD = "Object doesn't support operation"
BAD_OPTION = "Illegal option value"

DEFAULT_CONFIG = {
    "fill": "",
    "outline": "black",
    "width": "1",
    "arrow": "none",
    "text": "",
    "justify": "center",
    "font": ("helvetica", 12, "normal"),
}

# Clicks that getMouse() returns, in order, as (x, y) pairs. The picture generator
# fills this list before running a program; when it is empty, getMouse() clicks
# the middle of the window, which is enough for the checker.
scripted_clicks = []

# Every window a program opened, so the tools can look at them afterwards.
windows = []


class GraphicsError(Exception):
    """Raised for the same mistakes the real library refuses."""


def color_rgb(r, g, b):
    """A colour from red, green and blue amounts (0 to 255), as the library writes it."""
    return "#%02x%02x%02x" % (r, g, b)


def update(rate=None):
    """The real library redraws the screen here; there is no screen to redraw."""


class GraphWin:
    def __init__(self, title="Graphics Window", width=200, height=200, autoflush=True):
        self.title = title
        self.width = int(width)
        self.height = int(height)
        self.autoflush = autoflush
        self.background = None  # the system's default window colour
        self.items = []
        self.closed = False
        # The drawing at each getMouse() call (the window waiting for a click) and
        # when the window was closed: lists of shape descriptions, in drawing order.
        self.snapshots = []
        windows.append(self)

    def __repr__(self):
        return "Closed GraphWin" if self.isClosed() else "GraphWin('{}', {}, {})".format(self.title, self.width, self.height)

    def _check_open(self):
        if self.closed:
            raise GraphicsError("window is closed")

    def setBackground(self, color):
        self._check_open()
        self.background = color

    def close(self):
        if self.closed:
            return
        self.snapshots.append(("close", None, self.scene()))
        self.closed = True

    def isClosed(self):
        return self.closed

    def isOpen(self):
        return not self.closed

    def getWidth(self):
        return self.width

    def getHeight(self):
        return self.height

    def getMouse(self):
        if self.isClosed():
            raise GraphicsError("getMouse in closed window")
        x, y = scripted_clicks.pop(0) if scripted_clicks else (self.width // 2, self.height // 2)
        self.snapshots.append(("getMouse", (x, y), self.scene()))
        return Point(x, y)

    def checkMouse(self):
        if self.isClosed():
            raise GraphicsError("checkMouse in closed window")
        return None

    def scene(self):
        """What the window shows now: one description per drawn shape, bottom first."""
        return [item._describe() for item in self.items]


class GraphicsObject:
    def __init__(self, options):
        self.canvas = None
        self.config = {option: DEFAULT_CONFIG[option] for option in options}

    def setFill(self, color):
        self._reconfig("fill", color)

    def setOutline(self, color):
        self._reconfig("outline", color)

    def setWidth(self, width):
        self._reconfig("width", width)

    def draw(self, graphwin):
        if self.canvas and not self.canvas.isClosed():
            raise GraphicsError(OBJ_ALREADY_DRAWN)
        if graphwin.isClosed():
            raise GraphicsError("Can't draw to closed window")
        self.canvas = graphwin
        graphwin.items.append(self)
        return self

    def undraw(self):
        if not self.canvas:
            return
        if not self.canvas.isClosed():
            self.canvas.items.remove(self)
        self.canvas = None

    def move(self, dx, dy):
        self._move(dx, dy)

    def _reconfig(self, option, setting):
        if option not in self.config:
            raise GraphicsError(UNSUPPORTED_METHOD)
        self.config[option] = setting

    def _move(self, dx, dy):
        raise NotImplementedError

    def _describe(self):
        raise NotImplementedError


class Point(GraphicsObject):
    def __init__(self, x, y):
        GraphicsObject.__init__(self, ["outline", "fill"])
        self.setFill = self.setOutline
        self.x = float(x)
        self.y = float(y)

    def __repr__(self):
        return "Point({}, {})".format(self.x, self.y)

    def _move(self, dx, dy):
        self.x = self.x + dx
        self.y = self.y + dy

    def clone(self):
        other = Point(self.x, self.y)
        other.config = self.config.copy()
        return other

    def getX(self):
        return self.x

    def getY(self):
        return self.y

    def _describe(self):
        return {"kind": "point", "x": self.x, "y": self.y, "color": self.config["outline"]}


class _BBox(GraphicsObject):
    def __init__(self, p1, p2, options=("outline", "width", "fill")):
        GraphicsObject.__init__(self, list(options))
        self.p1 = p1.clone()
        self.p2 = p2.clone()

    def _move(self, dx, dy):
        self.p1.x = self.p1.x + dx
        self.p1.y = self.p1.y + dy
        self.p2.x = self.p2.x + dx
        self.p2.y = self.p2.y + dy

    def getP1(self):
        return self.p1.clone()

    def getP2(self):
        return self.p2.clone()

    def getCenter(self):
        return Point((self.p1.x + self.p2.x) / 2.0, (self.p1.y + self.p2.y) / 2.0)

    def _box(self, kind):
        return {
            "kind": kind,
            "x1": self.p1.x, "y1": self.p1.y, "x2": self.p2.x, "y2": self.p2.y,
            "fill": self.config.get("fill", ""), "outline": self.config["outline"], "width": float(self.config["width"]),
        }


class Rectangle(_BBox):
    def __repr__(self):
        return "Rectangle({}, {})".format(str(self.p1), str(self.p2))

    def clone(self):
        other = Rectangle(self.p1, self.p2)
        other.config = self.config.copy()
        return other

    def _describe(self):
        return self._box("rectangle")


class Oval(_BBox):
    def __repr__(self):
        return "Oval({}, {})".format(str(self.p1), str(self.p2))

    def clone(self):
        other = Oval(self.p1, self.p2)
        other.config = self.config.copy()
        return other

    def _describe(self):
        return self._box("oval")


class Circle(Oval):
    def __init__(self, center, radius):
        p1 = Point(center.x - radius, center.y - radius)
        p2 = Point(center.x + radius, center.y + radius)
        Oval.__init__(self, p1, p2)
        self.radius = radius

    def __repr__(self):
        return "Circle({}, {})".format(str(self.getCenter()), str(self.radius))

    def clone(self):
        other = Circle(self.getCenter(), self.radius)
        other.config = self.config.copy()
        return other

    def getRadius(self):
        return self.radius


class Line(_BBox):
    def __init__(self, p1, p2):
        _BBox.__init__(self, p1, p2, ["arrow", "fill", "width"])
        self.setFill(DEFAULT_CONFIG["outline"])
        self.setOutline = self.setFill

    def __repr__(self):
        return "Line({}, {})".format(str(self.p1), str(self.p2))

    def clone(self):
        other = Line(self.p1, self.p2)
        other.config = self.config.copy()
        return other

    def setArrow(self, option):
        if option not in ["first", "last", "both", "none"]:
            raise GraphicsError(BAD_OPTION)
        self._reconfig("arrow", option)

    def _describe(self):
        return {
            "kind": "line",
            "x1": self.p1.x, "y1": self.p1.y, "x2": self.p2.x, "y2": self.p2.y,
            "color": self.config["fill"], "width": float(self.config["width"]), "arrow": self.config["arrow"],
        }


class Polygon(GraphicsObject):
    def __init__(self, *points):
        # A single list of Points works too.
        if len(points) == 1 and type(points[0]) == type([]):
            points = points[0]
        self.points = list(map(Point.clone, points))
        GraphicsObject.__init__(self, ["outline", "width", "fill"])

    def __repr__(self):
        return "Polygon" + str(tuple(p for p in self.points))

    def clone(self):
        other = Polygon(*self.points)
        other.config = self.config.copy()
        return other

    def getPoints(self):
        return list(map(Point.clone, self.points))

    def _move(self, dx, dy):
        for p in self.points:
            p.move(dx, dy)

    def _describe(self):
        return {
            "kind": "polygon",
            "points": [(p.x, p.y) for p in self.points],
            "fill": self.config["fill"], "outline": self.config["outline"], "width": float(self.config["width"]),
        }


class Text(GraphicsObject):
    def __init__(self, p, text):
        GraphicsObject.__init__(self, ["justify", "fill", "text", "font"])
        self.setText(text)
        self.anchor = p.clone()
        self.setFill(DEFAULT_CONFIG["outline"])
        self.setOutline = self.setFill

    def __repr__(self):
        return "Text({}, '{}')".format(self.anchor, self.getText())

    def _move(self, dx, dy):
        self.anchor.move(dx, dy)

    def clone(self):
        other = Text(self.anchor, self.config["text"])
        other.config = self.config.copy()
        return other

    def setText(self, text):
        self._reconfig("text", text)

    def getText(self):
        return self.config["text"]

    def getAnchor(self):
        return self.anchor.clone()

    def setFace(self, face):
        if face in ["helvetica", "arial", "courier", "times roman"]:
            f, s, b = self.config["font"]
            self._reconfig("font", (face, s, b))
        else:
            raise GraphicsError(BAD_OPTION)

    def setSize(self, size):
        if 5 <= size <= 36:
            f, s, b = self.config["font"]
            self._reconfig("font", (f, size, b))
        else:
            raise GraphicsError(BAD_OPTION)

    def setStyle(self, style):
        if style in ["bold", "normal", "italic", "bold italic"]:
            f, s, b = self.config["font"]
            self._reconfig("font", (f, s, style))
        else:
            raise GraphicsError(BAD_OPTION)

    def setTextColor(self, color):
        self.setFill(color)

    def _describe(self):
        face, size, style = self.config["font"]
        return {
            "kind": "text", "x": self.anchor.x, "y": self.anchor.y, "text": str(self.config["text"]),
            "color": self.config["fill"], "face": face, "size": size, "style": style,
        }
