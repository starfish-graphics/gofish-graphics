# A GoG/Seaborn-style Collection of Charts

## Why do this?

Most people just want to call the chart type that they need to get their job done. In fact this is
basically what the GoG provides us! (Although one thing it doesn't provide is flexible levels of
abstraction. For instance, GoG libraries typically don't have a pie chart/mark b/c it can be
constructed with a bar chart/mark.)

Seaborn is another great example of a charting library that is just a ton of charts. ECharts
another.

There are charts that are further away from each other at the mid-level than they are at this
high-level. For example, an area chart and a stacked area chart should be pretty similar, but
require a bit of work at the mid-level. Switching from vertical to horizontal also requires more
changes at the mid-level than at the high-level.

This level also requires learning fewer things off the bat.

## Syntax Considerations

Should extend naturally to the mid-level and low-level APIs as they can be mixed and matched.

Observable Plot has a pretty nice syntax that would be nice to mirror.

BUT I don't think we want eg "bar" or "rect" to magically play the role of a chart and a shape the
way marks sometimes do b/c I find that confusing.

## Implementation Considerations

Most of them should be implementable using the mid-level syntax. This will make it easier to start
using the mid-level syntax and also acts as a kind of gut-check that chart-like things are actually
expressible in the mid-level syntax.
