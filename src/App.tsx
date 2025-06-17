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
import { testFishStackedBar, testFishStackedBarDataStyle } from "./tests/fishStackedBar";
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
import { testPolarCenterStackedBarEmbedded } from "./tests/polarCenterStackedBarEmbedded";
import { testStacking } from "./tests/stacking";
import { testVLStackedBar } from "./tests/vlStackedBar";
import { testVLWaffle } from "./tests/vlWaffle";
import { testVLWaffleRefactor } from "./tests/vlWaffleRefactor";
import { testVLStackedBarRefactor } from "./tests/vlStackedBarRefactor";
import { testVLWaffleRefactorV2 } from "./tests/vlWaffleRefactorV2";
import { testVLStackedBarRefactorV2 } from "./tests/vlStackedBarRefactorV2";
import { testVLStackedBarRefactorTextured } from "./tests/vlStackedBarRefactorTextured";
import { testFishRibbonChartTextured } from "./tests/fishRibbonChartTextured";
import { testFishPolarRibbonChartTextured } from "./tests/fishPolarRibbonChartTextured";
import { GoFishSolid } from "./ast";
import { DitheringConfig, generateDithering } from "./tests/density";
import { frame, rect, stackY } from "./lib";

const ditheringTestWidth = 800;

// For sinusoidal dithering
const sinusoidalSampling = (x: number) => {
  const frequency = 2;
  const phase = 0;
  const normalizedX = (x / ditheringTestWidth) * 2 * Math.PI * frequency;
  return (Math.sin(normalizedX + phase) + 1) / 2;
};

const sinePoints = generateDithering({ width: ditheringTestWidth, maxDensitySpacing: 8 }, sinusoidalSampling);

// For other patterns like linear, exponential, etc.
const uniformSampling = (x: number) => 0.2;
const uniformPoints = generateDithering({ width: ditheringTestWidth, maxDensitySpacing: 4 }, uniformSampling);
const exponentialSampling = (x: number) => Math.exp(-x / 50);
const exponentialPoints = generateDithering({ width: ditheringTestWidth, maxDensitySpacing: 4 }, exponentialSampling);
const linearSampling = (x: number) => x / 2000;
const linearPoints = generateDithering({ width: ditheringTestWidth, maxDensitySpacing: 4 }, linearSampling);

const defs = [
  <pattern id="noFill" fill="white" width="1" height="1" patternUnits="userSpaceOnUse">
    <rect width="1" height="1" />
  </pattern>,

  <pattern id="solidGrayFill" width="1" height="1" patternUnits="userSpaceOnUse">
    <rect width="1" height="1" fill="#808080" />
  </pattern>,

  <pattern
    id="diamondFill"
    patternUnits="userSpaceOnUse"
    width="13.23mm"
    height="26.46mm"
    patternTransform="scale(2) rotate(0)"
  >
    <path
      d="M12.5 0L0 25l12.5 25L25 25 12.5 0zm25 50L25 75l12.5 25L50 75 37.5 50z"
      stroke-width="1"
      stroke="none"
      fill="#000000"
    />
  </pattern>,

  <pattern id="denseDottedFill" width="2.5mm" height="2.5mm" patternUnits="userSpaceOnUse">
    <circle cx="1.25mm" cy="1.25mm" r="0.6mm" fill="black" />
  </pattern>,

  <pattern id="verticalFill" width="5mm" height="0.5mm" patternUnits="userSpaceOnUse">
    <line x1="1.25mm" y1="-1mm" x2="1.25mm" y2="1.5mm" stroke="black" stroke-width="1.3mm" />
  </pattern>,

  <pattern id="horizontalFill" width="0.5mm" height="5mm" patternUnits="userSpaceOnUse">
    <line x1="-1mm" y1="1.25mm" x2="1.5mm" y2="1.25mm" stroke="black" stroke-width="1.3mm" />
  </pattern>,

  <pattern id="dottedFill" width="5mm" height="5mm" patternUnits="userSpaceOnUse" fill="black" stroke="none">
    <circle cx="1.25mm" cy="1.25mm" r="1mm" />
    <circle cx="6.25mm" cy="6.25mm" r="1mm" />
  </pattern>,

  <pattern id="crossFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line
      x1="2.54mm"
      y1="0mm"
      x2="2.54mm"
      y2="5.08mm"
      stroke="black"
      stroke-width="0.8mm"
      stroke-dasharray="1mm, 1mm"
    />
  </pattern>,

  <pattern id="diagonalLeftFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line x1="-0.5mm" y1="-1.27mm" x2="7.12mm" y2="6.35mm" stroke="black" stroke-width="0.8mm" />
    <line x1="-1.77mm" y1="2.54mm" x2="2.04mm" y2="-1.27mm" stroke="black" stroke-width="0.8mm" />
  </pattern>,

  <pattern id="diagonalRightFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line x1="7.12mm" y1="-1.27mm" x2="-0.5mm" y2="6.35mm" stroke="black" stroke-width="0.8mm" />
    <line x1="2.04mm" y1="-1.27mm" x2="-1.77mm" y2="2.54mm" stroke="black" stroke-width="0.8mm" />
  </pattern>,
];

const App: Component = () => {
  return (
    <div style={{ "margin-left": "20px" }}>
      <GoFishSolid width={250} height={300} defs={defs}>
        {testFishStackedBar()}
      </GoFishSolid>
      <br />
      <GoFishSolid width={250} height={300} defs={defs}>
        {testFishStackedBarDataStyle()}
      </GoFishSolid>
      <br />
      <GoFishSolid width={500} height={200} defs={defs} axes={true}>
        {testFishBar()}
      </GoFishSolid>
      <GoFishSolid width={800} height={1000} defs={defs}>
        {frame({}, [
          frame({ y: 10 }, [
            ...sinePoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          frame({ y: 100 }, [
            ...uniformPoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          frame({ y: 200 }, [
            ...exponentialPoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          rect({ x: 0, y: 260, w: 1000, h: 4, fill: "black" }),
          frame({ y: 300 }, [
            ...sinePoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            // rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          frame({ y: 400 }, [
            ...uniformPoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            // rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          frame({ y: 500 }, [
            ...exponentialPoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" })),
            // rect({ x: 0, y: 10, w: 1000, h: 2, fill: "black" }),
          ]),
          // frame(
          //   { y: 300 },
          //   linearPoints.map((p) => rect({ x: p, w: 4, h: 20, fill: "black" }))
          // ),
        ])}
      </GoFishSolid>
      <h1>Welcome!</h1>
      <div style={{ "max-width": "520px" }}>
        Welcome to the GoFish supplemental code! Below you'll find all the graphics we made in GoFish for the paper. If
        you navigate to <code>App.tsx</code>, you can see the code that generates each one.
        <br />
        <br />
        <b>Note:</b> Some colors are modified slightly from the paper, because they now use the default color scale. The
        data set for the examples in Sec. 6.3 have been modified to extend the <code>catch</code> data set from Sec. 3.
      </div>
      <br />
      <br />
      <br />
      <br />
      <br />
      <GoFishSolid width={1000} height={1000} defs={defs}>
        {testFishRibbonChartTextured()}
      </GoFishSolid>
      <br />
      <br />
      <br />
      <GoFishSolid width={1000} height={500} defs={defs}>
        {testVLStackedBarRefactorTextured()}
      </GoFishSolid>
      <br />
      <br />
      <GoFishSolid width={200} height={200} defs={defs}>
        {testVLStackedBar()}
      </GoFishSolid>
      <GoFishSolid width={200} height={200} defs={defs}>
        {testVLStackedBarRefactor()}
      </GoFishSolid>
      <GoFishSolid width={200} height={200} defs={defs}>
        {testVLStackedBarRefactorV2()}
      </GoFishSolid>
      <GoFishSolid width={200} height={200} defs={defs}>
        {testVLWaffleRefactor()}
      </GoFishSolid>
      <GoFishSolid width={200} height={200} defs={defs}>
        {testVLWaffleRefactorV2()}
      </GoFishSolid>
      <GoFishSolid width={500} height={200} defs={defs}>
        {testFishBar()}
      </GoFishSolid>
      <GoFishSolid width={250} height={300} defs={defs}>
        {testFishStackedBar()}
      </GoFishSolid>
      <GoFishSolid width={350} height={300} defs={defs}>
        {testFishGroupedBar()}
      </GoFishSolid>
      <h1>Walkthrough (Sec. 3)</h1>
      <h2>1. Bar Chart</h2>
      <GoFishSolid width={500} height={200} defs={defs}>
        {testFishBar()}
      </GoFishSolid>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px", "align-items": "flex-start" }}>
        <div
          style={{ display: "flex", "flex-direction": "column", "justify-content": "space-between", height: "420px" }}
        >
          <h2>2a. Stacked Bar Chart</h2>
          <GoFishSolid width={250} height={300} defs={defs}>
            {testFishStackedBar()}
          </GoFishSolid>
        </div>
        <div
          style={{ display: "flex", "flex-direction": "column", "justify-content": "space-between", height: "420px" }}
        >
          <h2>2b. Grouped Bar Chart</h2>
          <GoFishSolid width={350} height={300} defs={defs}>
            {testFishGroupedBar()}
          </GoFishSolid>
        </div>
        <div
          style={{ display: "flex", "flex-direction": "column", "justify-content": "space-between", height: "400px" }}
        >
          <h2>2c. Waffle Chart</h2>
          <GoFishSolid width={300} height={350} defs={defs}>
            {testFishWaffle()}
          </GoFishSolid>
        </div>
      </div>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px" }}>
        <div>
          <h2>3. Ribbon Chart</h2>
          <GoFishSolid width={500} height={400} defs={defs}>
            {testFishRibbonChart()}
          </GoFishSolid>
        </div>
        <div>
          <h2>4. Polar Ribbon Chart</h2>
          <GoFishSolid width={500} height={400} defs={defs} transform={{ x: 200, y: 200 }}>
            {testFishPolarRibbonChart()}
          </GoFishSolid>
        </div>
      </div>
      <br />
      <br />
      <br />
      <h1>Building a Streamgraph (Sec. 6.1)</h1>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px", "flex-wrap": "wrap" }}>
        <div>
          <h2>1. Scatterplot</h2>
          <GoFishSolid width={200} height={100} defs={defs}>
            {testScatterplot()}
          </GoFishSolid>
        </div>
        <div>
          <h2>2. Line Chart</h2>
          <GoFishSolid width={200} height={100} defs={defs}>
            {testLineChart()}
          </GoFishSolid>
        </div>
        <div>
          <h2>3. Layered Area Chart</h2>
          <GoFishSolid width={200} height={100} defs={defs}>
            {testAreaChart()}
          </GoFishSolid>
        </div>
        <div>
          <h2>4. Stacked Area Chart</h2>
          <GoFishSolid width={200} height={100} defs={defs}>
            {testStackedAreaChart()}
          </GoFishSolid>
        </div>
        <div>
          <h2>5. Streamgraph</h2>
          <GoFishSolid width={200} height={100} defs={defs}>
            {testStreamgraph()}
          </GoFishSolid>
        </div>
      </div>
      <br />
      <br />
      <br />
      <h1>Polar Grouped Bar Chart (Sec. 4)</h1>
      <GoFishSolid width={500} height={300} defs={defs} transform={{ x: 50, y: 250 }}>
        {testPolarGroupedBar()}
      </GoFishSolid>
      <h1>Waffles to Nested Mosaics, Icicles to Node-Link Trees (Sec. 6.2)</h1>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px", "flex-wrap": "wrap" }}>
        <div>
          <h2>Nested Waffle</h2>
          <GoFishSolid width={200} height={400} defs={defs}>
            {testNestedWaffle()}
          </GoFishSolid>
        </div>
        <div>
          <h2>Nested Mosaic</h2>
          <GoFishSolid width={200} height={400} defs={defs}>
            {testNestedMosaic()}
          </GoFishSolid>
        </div>
        <div>
          <h2>Icicle Chart</h2>
          <GoFishSolid width={200} height={400} defs={defs}>
            {testIcicle()}
          </GoFishSolid>
        </div>
        <div>
          <h2>Sankey Tree</h2>
          <GoFishSolid width={400} height={400} defs={defs}>
            {testSankeyIcicle()}
          </GoFishSolid>
        </div>
      </div>
      <br />
      <br />
      <br />
      <h1>Scatter Pies and Flowers and Balloons... Oh My! (Sec. 6.3)</h1>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px", "flex-wrap": "wrap" }}>
        <div>
          <h2>Scatter Pie</h2>
          <GoFishSolid width={250} height={200} defs={defs}>
            {testScatterPie2()}
          </GoFishSolid>
        </div>
        <div>
          <h2>Flower Chart</h2>
          <GoFishSolid width={250} height={200} defs={defs}>
            {testScatterFlower(200)}
          </GoFishSolid>
        </div>
        <div>
          <h2>Balloon Chart</h2>
          <GoFishSolid width={300} height={200} defs={defs}>
            {testScatterBalloon2(200)}
          </GoFishSolid>
        </div>
      </div>
      <br />
      <br />
      <br />
      <h1>Polar Stacked Bar Embedding (Sec. 6.4)</h1>
      <div style={{ display: "flex", "flex-direction": "row", gap: "40px", "flex-wrap": "wrap" }}>
        <div>
          <h2>Not Embedded</h2>
          <GoFishSolid width={300} height={300} defs={defs} transform={{ x: 200, y: 100 }}>
            {testPolarCenterStackedBar()}
          </GoFishSolid>
        </div>
        <div>
          <h2>Embedded</h2>
          <GoFishSolid width={300} height={300} defs={defs} transform={{ x: 200, y: 100 }}>
            {testPolarCenterStackedBarEmbedded()}
          </GoFishSolid>
        </div>
      </div>
      <br />
      <br />
      <br />
      {/* <h2>Nested Waffle</h2>
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
      {testLineChart({ width: 500, height: 100 })} */}
      {/* <h2>Sankey Icicle</h2>
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
      {testPolarGroupedBar({ width: 500, height: 300 })} */}
      {/* <h2>Wrap</h2>
      {testWrap({ width: 500, height: 300 })} */}
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
