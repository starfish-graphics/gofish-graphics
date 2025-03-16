import type { Component } from "solid-js";
import { testRect } from "./tests/rect";

const App: Component = () => {
  return <div>{testRect({ width: 100, height: 100 })}</div>;
};

export default App;
