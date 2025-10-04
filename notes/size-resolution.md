# Size Resolution

To map data to screen space, we need to figure out how to scale it to fit. As a rule of thumb, we
want all of underlying space to be visible. As a consequence, bar charts should never be truncated,
because each bar is fully embedded in the underlying space. On the other hand, a scatterplot's
points may be truncated on the edges of the frame since their sizes are not embedded in the
underlying space of the graphic.

## Continuous Space Resolution

For position and interval spaces, we are basically mapping some interval of minimum and maximum
values to available physical space. This can be performed by a traditional scale function. For now,
we assume these scales are always linear and lean on data pre-processing and coordinate transforms
to introduce non-linearities.

## Discrete Space Resolution

Layouts like `spread`'s arrange things using pixel-based spacing (like putting 8 pixels of spacing
between bars) so we can't compute a scale function right away. Instead, we assume we are looking for
some linear scale factor (data could be scaled using a non-linear scale function before this) and we have to figure
out how to scale the shapes that are being placed by creating a function from the scale factor to
the output size if we use that scale factor. Then we solve.
