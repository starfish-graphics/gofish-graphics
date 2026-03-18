"""Forward Syntax V3/Streamgraph — mirrors Streamgraph.stories.tsx

BLOCKED: requires Layer (multi-chart composition).

What it would look like once Layer is supported:

    from gofish import chart, spread, stack, scaffold, select, area, group
    from stories.data.seafood import seafood

    def default(w=400, h=400):
        bars = (
            chart(seafood)
            .flow(
                spread("lake", dir="x", spacing=64, alignment="middle"),
                stack("species", dir="y"),
            )
            .mark(scaffold(h="count", fill="species").name("bars"))
        )
        overlay = chart(select("bars")).flow(group("species")).mark(area(opacity=0.8))
        return Layer([bars, overlay])
"""

TITLE = "Forward Syntax V3/Streamgraph"


def default(w=400, h=400):
    raise NotImplementedError("Streamgraph requires Layer — not yet implemented in Python wrapper")
