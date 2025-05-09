---
layout: false
---

<script setup>
  import { VPButton } from 'vitepress/theme';
  import StackV from '../components/StackV.vue';
</script>

<div style="background-color: #fdf6f3; min-height: 100vh; padding-top: 2rem; padding-bottom: 2rem; text-align: center;">
<StackV gap="2rem">
  <StackV gap="2em">
    <h1 style="font-family: 'Balsamiq Sans', sans serif; color: coral; font-size: 72pt; margin: 2rem;"><b>Starfish Graphics</b></h1>
    <h2 style="font-family: 'Source Sans 3', sans serif; font-size: 36pt; color: #301812;">Make stylish charts and diagrams in JavaScript with ease</h2>
  </StackV>

  <div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 800px; margin-top: 2rem; margin-bottom: 0rem; margin-left: auto; margin-right: auto;">
    <img src="https://placehold.co/250x200" alt="Chart example 1" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 2" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 3" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 4" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 5" style="width: 100%; border-radius: 8px;">
    <img src="https://placehold.co/250x200" alt="Chart example 6" style="width: 100%; border-radius: 8px;">
  </div>

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

  <div style="background-color: #fff1eb; width: 64%; padding: 2rem; padding-right: 1em; padding-bottom: 1em; margin: 2rem auto; border-radius: 12px;">
    <StackV gap="2rem" align="flex-start" style="margin: 0 auto;">
      <h2 style="font-family: 'Balsamiq Sans', sans serif; font-size: 36pt; color: coral;">Why Starfish?</h2>
      <StackV gap="1rem" width="100%" align="flex-start">
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
