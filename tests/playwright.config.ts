import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 60_000,
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
});
