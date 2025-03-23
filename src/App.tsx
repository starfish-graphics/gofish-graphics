import type { Component } from "solid-js";
import { testRect } from "./tests/rect";
import { testBar } from "./tests/bar";
import { testGroupedBar } from "./tests/groupedBar";
import { testStackedBar } from "./tests/stackedBar";
import { testStackedBarWithSpacing } from "./tests/stackedBarWithSpacing";
import { testColorPalette } from "./tests/colorPalette";
import { testRibbonChart } from "./tests/ribbonChart";
import { testColor10 } from "./tests/color10";
import { testPolarRibbon } from "./tests/polarRibbon";
import { testPolarRect } from "./tests/polarRect";
import { testPolarRectLineY } from "./tests/polarRectLineY";
import { testPolarRectLineX } from "./tests/polarRectLineX";
import { testPolarRectAreaXY } from "./tests/polarRectAreaXY";
import { testPolarBar } from "./tests/polarBar";
import { testPolarGroupedBar } from "./tests/polarGroupedBar";
import { testPolarRadialGroupedBar } from "./tests/polarRadialGroupedBar";

const App: Component = () => {
  return (
    <div>
      {/* <h2>Rect</h2>
      {testRect({ width: 100, height: 100 })}
      <h2>Bar</h2>
      {testBar({ width: 500, height: 100 })}
      <h2>Grouped Bar</h2>
      {testGroupedBar({ width: 500, height: 200 })}
      <h2>Stacked Bar</h2>
      {testStackedBar({ width: 500, height: 200 })}
      <h2>Stacked Bar With Spacing</h2>
      {testStackedBarWithSpacing({ width: 500, height: 200 })}
      <h2>Ribbon Chart</h2>
      {testRibbonChart({ width: 500, height: 300 })} */}
      {/* <h2>Polar Ribbon Chart</h2>
      {testPolarRibbon({ width: 500, height: 300 })} */}
      <h2>Polar Rect</h2>
      {testPolarRect({ width: 500, height: 300 })}
      <h2>Polar Rect Line Y</h2>
      {testPolarRectLineY({ width: 500, height: 300 })}
      <h2>Polar Rect Line X</h2>
      {testPolarRectLineX({ width: 500, height: 300 })}
      <h2>Polar Rect Area XY</h2>
      {testPolarRectAreaXY({ width: 500, height: 300 })}
      <h2>Polar Bar</h2>
      {testPolarBar({ width: 500, height: 300 })}
      <h2>Polar Grouped Bar</h2>
      {testPolarGroupedBar({ width: 500, height: 300 })}
      <h2>Polar Radial Grouped Bar</h2>
      {testPolarRadialGroupedBar({ width: 500, height: 300 })}
      {/* <h2>Color Palette</h2>
      {testColorPalette({ width: 1000, height: 500 })}
      <h2>Color 10</h2>
      {testColor10({ width: 1000, height: 1000 })} */}
    </div>
  );
};

export default App;
