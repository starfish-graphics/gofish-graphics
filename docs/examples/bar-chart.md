# Bar Chart

::: starfish example:bar-chart

**Live Editor**

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
  { letter: "D", frequency: 95 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];
```

:::
