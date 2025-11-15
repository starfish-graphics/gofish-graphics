<script setup>
const props = defineProps({
  gap: {
    type: String,
    default: "1rem",
  },
  align: {
    type: String,
    default: "center",
  },
  width: {
    type: String,
    default: "100%",
  },
});
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'row',
      alignItems: align,
      gap: gap,
      width: width,
    }"
  >
    <slot></slot>
  </div>
</template>
