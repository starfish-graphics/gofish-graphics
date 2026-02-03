// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import GoFishVue from "../../../components/GoFishVue.vue";
import ExampleGallery from "../../../components/ExampleGallery.vue";
import HomeGallery from "../../../components/HomeGallery.vue";
import { Sandbox } from "vitepress-plugin-sandpack";
import "vitepress-plugin-sandpack/dist/style.css";
import { StarfishLive } from "../../../components/StarfishLive";
import HeroCode from './components/HeroCode.vue'
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Put code snippet in the hero's image slot
      'home-hero-image': () => h(HeroCode),
      
    });
  },
  enhanceApp({ app, router }) {
    app.component("GoFishVue", GoFishVue);
    app.component("ExampleGallery", ExampleGallery);
    app.component("HomeGallery", HomeGallery);
    app.component("Sandbox", Sandbox);
    app.component("StarfishLive", StarfishLive);
  },
} satisfies Theme;
