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
import { testSankey } from "./tests/sankey";
import { testPolarRibbonOther } from "./tests/polarRibbonOther";
import { testPolarRibbonTransposed } from "./tests/polarRibbonTransposed";
import { testBipolarGroupedBar } from "./tests/bipolarGroupedBar";
import { testMosaic } from "./tests/mosaic";
import { testPieChart } from "./tests/pieChart";
import { testScatterPie } from "./tests/scatterPie";
import { testScatterPetal } from "./tests/scatterPetal";
import { testPetalChart } from "./tests/petalChart";
import { testWrap } from "./tests/testWrap";
import { testCenterBar } from "./tests/centerBar";
import { testPolarCenterBar } from "./tests/polarCenterBar";
import { testPolarCenterStackedBar } from "./tests/polarCenterStackedBar";
import { testPolarCenterRibbon } from "./tests/polarCenterRibbon";
import { testPolarCenterRibbonFishEdition } from "./tests/polarCenterRibbonFishEdition";
import { testBipolarBar } from "./tests/bipolarBar";
import { testNestedMosaic } from "./tests/nestedMosaic";
import { testIcicle } from "./tests/icicle";
import { testScatterFlower } from "./tests/scatterFlower";
import { testFishBar } from "./tests/fishBar";
import { testFishStackedBar } from "./tests/fishStackedBar";
import { testFishGroupedBar } from "./tests/fishGroupedBar";
import { testFishWaffle } from "./tests/fishWaffle";
import { testFishWaffleRefactor } from "./tests/fishWaffleRefactor";
import { testFishRibbonChart } from "./tests/fishRibbonChart";
import { testFishPolarRibbonChart } from "./tests/fishPolarRibbonChart";
import { testBalloon } from "./tests/balloon";
import { testSankeyIcicle } from "./tests/sankeyIcicle";
import { testLineChart } from "./tests/lineChart";
import { testAreaChart } from "./tests/areaChart";
import { testStackedAreaChart } from "./tests/stackedAreaChart";
import { testScatterplot } from "./tests/scatterplot";
import { testScatterBalloon } from "./tests/scatterBalloon";
import { testNestedWaffle } from "./tests/nestedWaffle";
import { testStreamgraph } from "./tests/streamgraph";
import { testScatterPie2 } from "./tests/scatterPie2";
import { testScatterBalloon2 } from "./tests/scatterBalloon2";
const App: Component = () => {
  return (
    <div style={{ "margin-left": "20px" }}>
      <h1>Walkthrough</h1>
      <h2>1. Bar Chart</h2>
      {testFishBar({ width: 500, height: 200 })}
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px" }}>
        <div>
          <h2>2a. Stacked Bar Chart</h2>
          {testFishStackedBar({ width: 250, height: 200 })}
        </div>
        <div>
          <h2>2b. Grouped Bar Chart</h2>
          {testFishGroupedBar({ width: 300, height: 200 })}
        </div>
        <div>
          <h2>2c. Waffle Chart</h2>
          {testFishWaffle({ width: 300, height: 200 })}
        </div>
      </div>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px" }}>
        <div>
          <h2>3. Ribbon Chart</h2>
          {testFishRibbonChart({ width: 500, height: 400 })}
        </div>
        <div>
          <h2>4. Polar Ribbon Chart</h2>
          {testFishPolarRibbonChart({ width: 500, height: 500 })}
        </div>
      </div>
      <h2>Nested Waffle</h2>
      {testNestedWaffle({ width: 800, height: 500 })}
      <h2>Nested Mosaic</h2>
      {testNestedMosaic({ width: 500, height: 300 })}
      <h2>Scatter Balloon</h2>
      {testScatterBalloon({ width: 500, height: 300 })}
      <h2>Scatterplot</h2>
      {testScatterplot({ width: 500, height: 100 })}
      <h2>Stacked Area Chart</h2>
      {testStackedAreaChart({ width: 500, height: 500 })}
      <h2>Streamgraph</h2>
      {testStreamgraph({ width: 500, height: 500 })}
      <h2>Area Chart</h2>
      {testAreaChart({ width: 500, height: 100 })}
      <h2>Line Chart</h2>
      {testLineChart({ width: 500, height: 100 })}
      <h2>Sankey Icicle</h2>
      {testSankeyIcicle({ width: 500, height: 1000 })}
      <h2>Balloon</h2>
      {testBalloon({ width: 300, height: 400 })}
      <h2>Fish Polar Ribbon Chart</h2>
      {testFishPolarRibbonChart({ width: 500, height: 500 })}
      <h2>Fish Ribbon Chart</h2>
      {testFishRibbonChart({ width: 500, height: 300 })}
      <h2>Fish Waffle Refactor</h2>
      {testFishWaffleRefactor({ width: 500, height: 400 })}
      <h2>Fish Bar</h2>
      {testFishBar({ width: 500, height: 200 })}
      <h2>Fish Stacked Bar</h2>
      {testFishStackedBar({ width: 500, height: 200 })}
      <h2>Fish Grouped Bar</h2>
      {testFishGroupedBar({ width: 500, height: 200 })}
      <h2>Fish Waffle</h2>
      {testFishWaffle({ width: 500, height: 400 })}
      <h2>Scatter Balloon 2</h2>
      {testScatterBalloon2({ width: 500, height: 300 })}
      <h2>Scatter Flower</h2>
      {testScatterFlower({ width: 500, height: 300 })}
      <h2>Scatter Pie 2</h2>
      {testScatterPie2({ width: 500, height: 300 })}
      <h2>Scatter Petal</h2>
      {testScatterPetal({ width: 500, height: 300 })}
      <h2>Icicle</h2>
      {testIcicle({ width: 500, height: 300 })}
      <h2>Mosaic</h2>
      {testMosaic({ width: 500, height: 200 })}
      <h2>Bipolar Bar</h2>
      {testBipolarBar({ width: 500, height: 300 })}
      <h2>Bipolar Grouped Bar</h2>
      {testBipolarGroupedBar({ width: 500, height: 300 })}
      <h2>Polar Center Ribbon Fish Edition</h2>
      {testPolarCenterRibbonFishEdition({ width: 500, height: 400 })}
      <h2>Polar Center Ribbon</h2>
      {testPolarCenterRibbon({ width: 500, height: 300 })}
      <h2>Polar Center Stacked Bar</h2>
      {testPolarCenterStackedBar({ width: 500, height: 300 })}
      <h2>Polar Center Bar</h2>
      {testPolarCenterBar({ width: 500, height: 300 })}
      <h2>Center Bar</h2>
      {testCenterBar({ width: 500, height: 300 })}
      <h2>Polar Radial Grouped Bar</h2>
      {testPolarRadialGroupedBar({ width: 500, height: 300 })}
      <h2>Wrap</h2>
      {testWrap({ width: 500, height: 300 })}
      <h2>Scatter Pie</h2>
      {testScatterPie({ width: 500, height: 300 })}
      <h2>Petal Chart</h2>
      {testPetalChart({ width: 500, height: 300 })}
      <h2>Pie Chart</h2>
      {testPieChart({ width: 500, height: 300 })}
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
      <h2>Ribbon Chart</h2>
      {testRibbonChart({ width: 500, height: 300 })}
      <h2>Polar Ribbon Chart</h2>
      {testPolarRibbon({ width: 500, height: 500 })}
      <h2>Polar Ribbon Transposed</h2>
      {testPolarRibbonTransposed({ width: 500, height: 500 })}
      <h2>Polar Ribbon Other</h2>
      {testPolarRibbonOther({ width: 500, height: 300 })}
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
      {/* <h2>Sankey</h2>
      {testSankey({ width: 500, height: 300 })} */}
      {/* <h2>Color Palette</h2>
      {testColorPalette({ width: 1000, height: 500 })}
      <h2>Color 10</h2>
      {testColor10({ width: 1000, height: 1000 })} */}
    </div>
  );
};

export default App;
