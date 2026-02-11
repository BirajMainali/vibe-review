<script setup lang="ts">
/**
 * LineSelector is a composable-like component for managing line selection state.
 * It's used as a utility — the actual selection logic is in DiffFile.vue.
 * This file serves as documentation of the selection model.
 *
 * Selection model:
 * - Click a line number to start selection
 * - Shift+click another line to extend selection
 * - Selection range: { filePath, startLine, endLine, side }
 * - "Add Comment" button appears when selection is active
 * - Clicking "Add Comment" opens ReviewPanel inline
 */
</script>

<template>
  <slot />
</template>
