"""Forward Syntax V3/Bar/Horizontal — mirrors BarHorizontal.stories.tsx"""

from gofish import chart, spread, rect
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Bar/Horizontal"


def default(w=400, h=400):
    return (
        chart(seafood)
        .flow(spread("lake", dir="y"))
        .mark(rect(w="count"))
    )
