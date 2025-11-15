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
    ['link', { rel: 'icon', href: '/gofish-logo.png' }]

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
      // { text: "Guides", link: "/guides/index.md" },
      // { text: "API Reference", link: "/api/index.md" },
    ],

    sidebar: {
      // "/examples/": [
      //   {
      //     text: "Examples",
      //     items: [
      //       {
      //         text: "Search",
      //         link: "/examples/",
      //       },
      //       {
      //         text: "All Examples",
      //         items: examplesData.load().examples.map((example) => ({
      //           text: example.title,
      //           link: example.demoUrl,
      //         })),
      //       },
      //     ],
      //   },
      // ],
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
        link: "https://github.com/starfish-graphics/gofish-graphics",
      },
    ],
  },
});
