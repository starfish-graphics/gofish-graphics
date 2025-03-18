import type { Component } from "solid-js";
import { testRect } from "./tests/rect";
import { testBar } from "./tests/bar";
import { testGroupedBar } from "./tests/groupedBar";
import { testStackedBar } from "./tests/stackedBar";
import { testStackedBarWithSpacing } from "./tests/stackedBarWithSpacing";
import { testColorPalette } from "./tests/colorPalette";

const App: Component = () => {
  return (
    <div>
      <h2>Rect</h2>
      {testRect({ width: 100, height: 100 })}
      <h2>Bar</h2>
      {testBar({ width: 500, height: 100 })}
      <h2>Grouped Bar</h2>
      {testGroupedBar({ width: 500, height: 200 })}
      <h2>Stacked Bar</h2>
      {testStackedBar({ width: 500, height: 200 })}
      <h2>Stacked Bar With Spacing</h2>
      {testStackedBarWithSpacing({ width: 500, height: 200 })}
      <h2>Color Palette</h2>
      {testColorPalette({ width: 1000, height: 1000 })}
    </div>
  );
};

export default App;
