"""Forward Syntax V3/Line Chart — mirrors LineChart.stories.tsx

BLOCKED: requires Layer (multi-chart composition).

What it would look like once Layer is supported:

    from gofish import chart, scatter, scaffold, select, line
    from stories.data.seafood import catch_locations_array

    def default(w=400, h=400):
        points = (
            chart(catch_locations_array)
            .flow(scatter("lake", x="x", y="y"))
            .mark(scaffold().name("points"))
        )
        lines = chart(select("points")).mark(line())
        return Layer([points, lines])
"""

TITLE = "Forward Syntax V3/Line Chart"


def default(w=400, h=400):
    raise NotImplementedError("Line chart requires Layer — not yet implemented in Python wrapper")
