import { defineConfig } from "vitepress";
import starfish from "./markdown-it-starfish";
import examplesData from "./data/examples.data.js";
import container from "markdown-it-container";
import { renderSandbox } from "vitepress-plugin-sandpack";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: { plugins: [vueJsx()] },
  appearance: false,
  // title: "Starfish Graphics",
  // description: "Documentation for Starfish",
  title: "GoFish Graphics",
  description: "Documentation for GoFish",
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Balsamiq+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Comic+Neue:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Fira+Code:wght@300..700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
      },
    ],
    ["link", { rel: "icon", href: "/gofish-logo.png" }],
  ],
  markdown: {
    config: (md) => {
      starfish(md);
      md.use(container, "starfish-live", {
        render(tokens, idx) {
          return renderSandbox(tokens, idx, "starfish-live");
        },
      });
    },
  },
  themeConfig: {
    logo: "/gofish-logo.png",
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started!", link: "/get-started" },
      { text: "Tutorial", link: "/tutorial" },
      { text: "Examples", link: "/examples/index.md" },
      { text: "API", link: "/api/" },
      {
        text: "Cheatsheets",
        items: [
          { text: "Overview", link: "/cheatsheet" },
          { text: "Shapes", link: "/marks-cheatsheet" },
          {
            text: "Coordinate Transforms",
            link: "/coordinate-transforms-cheatsheet",
          },
          {
            text: "Operators",
            link: "/operators-cheatsheet",
          },
        ],
      },
      // { text: "Guides", link: "/guides/index.md" },
      // { text: "API Reference", link: "/api/index.md" },
    ],

    sidebar: {
      "/api/": [
        {
          text: "Overview",
          link: "/api/",
        },
        {
          text: "How To",
          items: [
            { text: "Create a chart", link: "/api/howto/create-chart" },
            { text: "Create a glyph", link: "/api/howto/create-glyph" },
            { text: "Pick a layout operator", link: "/api/howto/operators" },
            { text: "Use selection", link: "/api/howto/selection" },
          ],
        },
        {
          text: "Core",
          items: [
            { text: "chart", link: "/api/core/chart" },
            { text: "flow", link: "/api/core/flow" },
            { text: "mark", link: "/api/core/mark" },
            { text: "render", link: "/api/core/render" },
          ],
        },
        {
          text: "Marks",
          items: [
            { text: "rect", link: "/api/marks/rect" },
            { text: "circle", link: "/api/marks/circle" },
            { text: "ellipse", link: "/api/marks/ellipse" },
            { text: "line", link: "/api/marks/line" },
            { text: "area", link: "/api/marks/area" },
            { text: "blank", link: "/api/marks/blank" },
            { text: "ref", link: "/api/marks/ref" },
          ],
        },
        {
          text: "Operators",
          items: [
            { text: "spread", link: "/api/operators/spread" },
            { text: "stack", link: "/api/operators/stack" },
            { text: "table", link: "/api/operators/table" },
            { text: "scatter", link: "/api/operators/scatter" },
            { text: "layer", link: "/api/operators/layer" },
            { text: "derive", link: "/api/operators/derive" },
            { text: "log", link: "/api/operators/log" },
          ],
        },
        {
          text: "Selection",
          items: [{ text: "select", link: "/api/selection/select" }],
        },
        {
          text: "Coordinates",
          items: [
            { text: "polar", link: "/api/coords/polar" },
            { text: "clock", link: "/api/coords/clock" },
          ],
        },
      ],
      "/": [
        {
          text: "Get Started!",
          link: "/get-started",
        },
        {
          text: "Tutorial",
          link: "/tutorial",
        },
        {
          text: "Examples",
          items: [
            {
              text: "Search",
              link: "/examples/",
            },
            {
              text: "All Examples",
              items: examplesData.load().examples.map((example) => ({
                text: example.title,
                link: example.demoUrl,
              })),
            },
          ],
        },
        {
          text: "API Reference",
          link: "/api/",
        },
        {
          text: "Reference",
          items: [
            {
              text: "Cheatsheet Overview",
              link: "/cheatsheet",
            },
            {
              text: "Shapes Cheat Sheet",
              link: "/shapes-cheatsheet",
            },
            {
              text: "Coordinate Transforms Cheat Sheet",
              link: "/coordinate-transforms-cheatsheet",
            },
          ],
        },
        // { text: "Examples", link: "/examples/" },
        // {
        //   text: "Examples List",
        //   collapsed: true,
        //   items: [
        //     // Programmatically generated example links
        //     ...examplesData.load().examples.map((example) => ({
        //       text: example.title,
        //       link: example.demoUrl,
        //     })),
        //     // { text: "Area Charts", link: "/examples/area-charts.md" },
        //     // { text: "Bar Charts", link: "/examples/bar-charts.md" },
        //     // { text: "Line Charts", link: "/examples/line-charts.md" },
        //     // { text: "Pie Charts", link: "/examples/pie-charts.md" },
        //     // { text: "Ribbon Charts", link: "/examples/ribbon-charts.md" },
        //     // { text: "Scatter Plots", link: "/examples/scatter-plots.md" },
        //   ],
        // },
        // {
        //   text: "API Reference",
        //   collapsed: true,
        //   items: [
        //     { text: "Starfish", link: "/api/starfish.md" },
        //     {
        //       text: "Shapes",
        //       items: [
        //         { text: "Rect", link: "/api/shapes/rect.md" },
        //         { text: "Circle", link: "/api/shapes/circle.md" },
        //       ],
        //     },
        //     {
        //       text: "Operators",
        //       items: [
        //         { text: "Stack", link: "/api/operators/stack.md" },
        //         { text: "Connect", link: "/api/operators/connect.md" },
        //       ],
        //     },
        //   ],
        // },
        /* {
        text: "Guides",
        collapsed: true,
        items: [
          { text: "Color", link: "/guides/color.md" },
          { text: "Labels", link: "/guides/labels.md" },
          { text: "Spacing", link: "/guides/spacing.md" },
          { text: "Style", link: "/guides/style.md" },
        ],
      }, */
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/gofish-graphics/gofish-graphics",
      },
    ],
  },
});
