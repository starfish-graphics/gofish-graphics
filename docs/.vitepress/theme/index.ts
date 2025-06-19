// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import GoFishVue from "../../../components/GoFishVue.vue";
import ExampleGallery from "../../../components/ExampleGallery.vue";
import HomeGallery from "../../../components/HomeGallery.vue";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router }) {
    app.component("GoFishVue", GoFishVue);
    app.component("ExampleGallery", ExampleGallery);
    app.component("HomeGallery", HomeGallery);
  },
} satisfies Theme;
