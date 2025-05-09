---
layout: false
---

<script setup>
  import { VPButton } from 'vitepress/theme';
  import StackV from '../components/StackV.vue';
  import StackH from '../components/StackH.vue';
</script>

<style>
@keyframes breathe {
  0% { transform: scale(1); } /* Start */
  28.6% { transform: scale(1.1); } /* Inhale complete (4s) */
  42.9% { transform: scale(1.1); } /* Hold complete (2s) */
  85.7% { transform: scale(1); } /* Exhale complete (6s) */
  100% { transform: scale(1); } /* Hold complete (4s) */
}
</style>

<div style="background-color: #fdf6f3; min-height: 100vh; padding-top: 2rem; padding-bottom: 2rem; text-align: center;">
<StackV gap="2rem">
  <StackV gap="2em">
    <h1 style="font-family: 'Balsamiq Sans', sans serif; color: coral; font-size: 72pt; margin: 2rem;"><b>Starfish Graphics</b></h1>
    <h2 style="font-family: 'Source Sans 3', sans serif; font-size: 36pt; color: #301812;">Make <span style="font-family: 'Dancing Script', cursive;">stylish</span> visualizations in JavaScript with <span style="display: inline-block; animation: breathe 14s ease-in-out infinite;">ease</span></h2>
  </StackV>

  <div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 800px; margin-top: 2rem; margin-bottom: 0rem; margin-left: auto; margin-right: auto;">
    <img src="./polar-ribbon-chart.png" alt="Chart example 1" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 2" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 3" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 4" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 5" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 6" style="width: 100%; border-radius: 8px;">
  </div>

<StackH width="fit-content" gap="1rem" style="margin: 0 auto;">
<div style="font-family: 'Fira Code', monospace; background-color: var(--vp-c-brand-soft); color: #fdf6f3; font-weight: 700; padding: 1rem; border-radius: 8px; display: inline-block; margin: 2rem 0;">
  npm install starfish-graphics
</div>
<div style="display: flex; gap: 0.5rem; justify-content: center;">
<VPButton
    tag="a"
    size="medium"
    text="Get Started!"
    theme="brand"
  />
<VPButton
    tag="a"
    size="medium"
    text="Examples"
    theme="alt"
  />
<VPButton
    tag="a"
    size="medium"
    text="Tutorial"
    theme="alt"
  />
<VPButton
    tag="a"
    size="medium"
    text="Theory"
    theme="alt"
  />
</div>
</StackH>

  <div style="background-color: #fff1eb; width: 64%; padding: 2rem; padding-right: 1em; padding-bottom: 1em; margin: 2rem auto; margin-top: 0rem; border-radius: 12px;">
    <StackV gap="2rem" align="flex-start" style="margin: 0 auto;">
      <h2 style="font-family: 'Balsamiq Sans', sans serif; font-size: 36pt; color: coral;">Why Starfish?</h2>
      <StackV gap="1.5rem" width="100%" align="flex-start">
        <StackV gap="0.6rem" width="100%" align="flex-start">
          <h3 style="font-family: 'Source Sans 3', sans serif; font-size: 24pt; color: #301812;">You're a star! Express yourself!</h3>
          <p style="font-family: 'Source Sans 3', sans serif; font-size: 16pt; color: #301812; text-align: left; margin: 0;">Minimalist? Maximalist? Formal? Whimsical? Whatever your style, Starfish is here for you.</p>
        </StackV>
        <StackV gap="0.6rem" width="100%" align="flex-start">
          <h3 style="font-family: 'Source Sans 3', sans serif; font-size: 24pt; color: #301812;">Beauty by default</h3>
          <p style="font-family: 'Source Sans 3', sans serif; font-size: 16pt; color: #301812; text-align: left; margin: 0;">Starfish's design system of colors, spacing, and arrows build on graphic design best practices helping you get beautiful results out of the box.</p>
        </StackV>
        <StackV gap="0.6rem" width="100%" align="flex-start">
          <h3 style="font-family: 'Source Sans 3', sans serif; font-size: 24pt; color: #301812;">Power when you need it</h3>
          <p style="font-family: 'Source Sans 3', sans serif; font-size: 16pt; color: #301812; text-align: left; margin: 0;">Starfish makes easy things simple, like bar charts and scatterplots. But its primitives can compose to make complex custom charts and diagrams.</p>
        </StackV>
      </StackV>
    </StackV>
  </div>
  </div>
  </StackV>
</div>
