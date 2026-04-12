"""Forward Syntax V3/Streamgraph — mirrors Streamgraph.stories.tsx"""

from gofish import Layer, chart, spread, stack, scaffold, select, area, group
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Streamgraph"


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
