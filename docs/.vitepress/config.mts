import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Starfish Graphics",
  description: "Documentation for Starfish",
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Balsamiq+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@300..700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
      },
    ],
  ],
  themeConfig: {
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started!", link: "/get-started/index.md" },
      { text: "Examples", link: "/examples/index.md" },
      { text: "Tutorial", link: "/tutorial/index.md" },
      { text: "Theory", link: "/theory/index.md" },
    ],

    sidebar: [
      {
        text: "Get Started!",
        collapsed: true,
        items: [
          { text: "Installation", link: "/get-started/index.md" },
          // { text: "Basic Usage", link: "/get-started" },
          // { text: "Configuration", link: "/get-started" },
        ],
      },
      {
        text: "Examples",
        collapsed: true,
        items: [{ text: "Examples", link: "/examples/index.md" }],
      },
      {
        text: "Tutorial",
        collapsed: true,
        items: [{ text: "Tutorial", link: "/tutorial/index.md" }],
      },
      {
        text: "Theory",
        collapsed: true,
        items: [{ text: "Theory", link: "/theory/index.md" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],
  },
});
