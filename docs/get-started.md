# Get Started!

GoFish is a JavaScript library for making bespoke graphics.

<!-- Here's a bar chart in GoFish:

::: starfish-live {template=vanilla-ts rtl lightTheme=aquaBlue darkTheme=atomDark previewHeight=400 coderHeight=512}

```ts index.ts
import { StackX, Rect, For, v } from "gofish-graphics";
import { alphabet } from "./dataset";

const root = document.getElementById("app");

// A bar chart is a horizontal stack...
StackX(
  { spacing: 4, alignment: "end", sharedScale: true },
  For(alphabet, (d) =>
    // ...of rectangles
    Rect({ w: 30, h: v(d.frequency) })
  )
).render(root, { width: 500, height: 300, axes: true });
```

```ts dataset.ts
export const alphabet = [
  { letter: "A", frequency: 28 },
  { letter: "B", frequency: 55 },
  { letter: "C", frequency: 43 },
  { letter: "D", frequency: 91 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];
```

:::

::: info Note

The editor is live! Try changing "spacing" or "w".

:::

To learn more, check out [our tutorial!](/tutorial.md) -->

1. Install GoFish

```bash
npm install gofish-graphics
```

2. Create a chart! Make sure to create or select a DOM element to render it.

::: starfish example:bar-chart hidden
:::

```ts
const alphabet = [
  { letter: "A", frequency: 28 },
  { letter: "B", frequency: 55 },
  { letter: "C", frequency: 43 },
  { letter: "D", frequency: 91 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];

const root = document.createElement("div");

StackX(
  { spacing: 4, alignment: "end", sharedScale: true },
  For(alphabet, (d) => Rect({ w: 30, h: v(d.frequency) }))
).render(root, { width: 688, height: 400, axes: true });
```

3. Anatomy of a GoFish specification

```ts
// `StackX` is a *graphical operator* that puts shapes in a horizontal stack
StackX(
  { spacing: 4, alignment: "end", sharedScale: true },
  // `For` creates an array of shapes
  For(alphabet, (d) =>
    // `Rect` is a basic shape
    // `v` tells GoFish it's a data value that should be scaled
    Rect({ w: 30, h: v(d.frequency) })
  )
  // finally, we render the chart!
).render(root, { width: 688, height: 400, axes: true });
```

4. Next steps

Go through [our tutorial](/tutorial), check out [some examples](/examples/index), or play with the live editor below!

::: starfish-live {template=vanilla-ts rtl lightTheme=aquaBlue darkTheme=atomDark previewHeight=400 coderHeight=512}

```ts index.ts
import { StackX, Rect, For, v } from "gofish-graphics";
import { alphabet } from "./dataset";

const root = document.getElementById("app");

// A bar chart is a horizontal stack...
StackX(
  { spacing: 4, alignment: "end", sharedScale: true },
  For(alphabet, (d) =>
    // ...of rectangles
    Rect({ w: 30, h: v(d.frequency) })
  )
).render(root, { width: 500, height: 300, axes: true });
```

```ts dataset.ts
export const alphabet = [
  { letter: "A", frequency: 28 },
  { letter: "B", frequency: 55 },
  { letter: "C", frequency: 43 },
  { letter: "D", frequency: 91 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];
```

:::
