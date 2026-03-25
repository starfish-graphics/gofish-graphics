import Reveal from "reveal.js";
import RevealHighlight from "reveal.js/plugin/highlight/highlight";
import RevealNotes from "reveal.js/plugin/notes/notes";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/white.css";
import "./hljs-github-light.css";
import "./style.css";
import { renderCharts, chartRenderers } from "./charts";

const deck = new Reveal({
  hash: true,
  transition: "none",
  navigationMode: "linear",
  width: 1280,
  height: 720,
  margin: 0.06,
  slideNumber: true,
  plugins: [RevealHighlight, RevealNotes],
  highlight: {
    highlightOnLoad: true,
  },
});

deck.initialize().then(() => {
  // Render all charts once reveal is ready
  renderCharts();
});

// Re-render charts on slide change in case containers weren't visible on init
deck.on("slidechanged", () => {
  // Find all chart containers in the current slide
  const currentSlide = deck.getCurrentSlide();
  if (!currentSlide) return;
  const containers = currentSlide.querySelectorAll("[id^='chart-']");
  containers.forEach((el) => {
    const id = el.id;
    // Only re-render if the container is empty (not yet rendered)
    if (el.children.length === 0 && chartRenderers[id]) {
      chartRenderers[id]();
    }
  });
});
