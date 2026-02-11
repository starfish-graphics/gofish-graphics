<script setup lang="ts">
import rawData from '../../../docs/descriptions/shapes.json';
import CheatSheetTemplate, {
  type DescriptionJson,
} from './CheatSheetTemplate.vue';

const data = rawData as DescriptionJson;
</script>

<template>
  <CheatSheetTemplate :data="data" />
</template>
