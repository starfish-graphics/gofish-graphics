import type { Component } from "solid-js";
import { testRect } from "./tests/rect";
import { testBar } from "./tests/bar";
import { testGroupedBar } from "./tests/groupedBar";
import { testStackedBar } from "./tests/stackedBar";
import { testStackedBarWithSpacing } from "./tests/stackedBarWithSpacing";

const App: Component = () => {
  return (
    <div>
      {/* <h2>Rect</h2>
      {testRect({ width: 100, height: 100 })}
      <h2>Bar</h2>
      {testBar({ width: 500, height: 100 })}
      <h2>Grouped Bar</h2>
      {testGroupedBar({ width: 500, height: 200 })} */}
      <h2>Stacked Bar</h2>
      {/* TODO: it almost works but we need to make the height HUGE for some reason... */}
      {testStackedBar({ width: 500, height: 10000 })}
      {/* <h2>Stacked Bar With Spacing</h2>
      {testStackedBarWithSpacing({ width: 500, height: 250 })} */}
    </div>
  );
};

export default App;
