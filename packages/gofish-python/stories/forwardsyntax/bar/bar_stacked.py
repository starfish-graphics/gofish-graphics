"""Forward Syntax V3/Bar/Stacked — mirrors BarStacked.stories.tsx"""

from gofish import chart, spread, stack, rect
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Bar/Stacked"


def default(w=400, h=400):
    return (
        chart(seafood)
        .flow(
            spread("lake", dir="x"),
            stack("species", dir="y"),
        )
        .mark(rect(h="count", fill="species"))
    )
