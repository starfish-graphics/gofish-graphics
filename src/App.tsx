import type { Component } from "solid-js";
import { testRect } from "./tests/rect";
import { testBar } from "./tests/bar";

const App: Component = () => {
  return (
    <div>
      <h2>Rect</h2>
      {testRect({ width: 100, height: 100 })}
      <h2>Bar</h2>
      {testBar({ width: 500, height: 100 })}
    </div>
  );
};

export default App;
