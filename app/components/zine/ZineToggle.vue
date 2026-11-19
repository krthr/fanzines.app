<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    class="ed-toggle"
    :aria-checked="model"
    @click="model = !model"
  >
    <span class="ed-toggle-track" aria-hidden="true">
      <span class="ed-toggle-knob" />
    </span>
    <span><slot /></span>
  </button>
</template>
