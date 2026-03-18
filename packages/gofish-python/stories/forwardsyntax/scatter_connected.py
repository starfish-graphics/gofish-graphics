"""Forward Syntax V3/Scatter (Connected & WithPieGlyphs) — mirrors Scatter.stories.tsx

BLOCKED:
- Connected: requires Layer (multi-chart composition)
- WithPieGlyphs: requires Layer + clock() coordinate transform + nested chart mark function

What they would look like once Layer and clock() are supported:

    # Connected
    from gofish import chart, scatter, circle, select, line
    from stories.data.driving_shifts import driving_shifts

    def connected(w=400, h=400):
        points = (
            chart(driving_shifts)
            .flow(scatter("year", x="miles", y="gas"))
            .mark(circle(r=4, fill="white", stroke="black", strokeWidth=2).name("points"))
        )
        lines = chart(select("points")).mark(line(stroke="black", strokeWidth=2))
        dots = (
            chart(driving_shifts)
            .flow(scatter("year", x="miles", y="gas"))
            .mark(circle(r=4, fill="white", stroke="black", strokeWidth=2))
        )
        return Layer([points, lines, dots])

    # WithPieGlyphs — also needs nested chart as mark function
"""

TITLE = "Forward Syntax V3/Scatter (Connected)"


def connected(w=400, h=400):
    raise NotImplementedError("Connected scatter requires Layer — not yet implemented in Python wrapper")


def with_pie_glyphs(w=400, h=400):
    raise NotImplementedError(
        "WithPieGlyphs requires Layer + clock() coordinate + nested chart mark — "
        "not yet implemented in Python wrapper"
    )
