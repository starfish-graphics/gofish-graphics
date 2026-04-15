"""Forward Syntax V3/Bar/Stacked Fluent — mirrors BarStackedFluent.stories.tsx

Uses .facet() and .stack() convenience methods instead of .flow(spread(...), stack(...)).
"""

from gofish import chart, rect
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Bar/Stacked Fluent"


def default(w=400, h=400):
    return (
        chart(seafood)
        .facet("lake", dir="x")
        .stack("species", dir="y")
        .mark(rect(h="count", fill="species"))
    )
