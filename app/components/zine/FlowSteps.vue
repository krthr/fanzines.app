<script setup lang="ts">
// Diseñar → Revisar → Imprimir y doblar. Step 3 is current while the
// "PDF listo" dialog is open.
defineProps<{ current: 2 | 3 }>()

const steps = ['Diseñar', 'Revisar', 'Imprimir y doblar']
</script>

<template>
  <ol class="steps" aria-label="Pasos para imprimir">
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="step"
      :class="{
        'is-done': index + 1 < current,
        'is-current': index + 1 === current
      }"
      :aria-current="index + 1 === current ? 'step' : undefined"
    >
      <span class="badge">
        <UIcon v-if="index + 1 < current" name="i-lucide-check" aria-hidden="true" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span class="label">{{ step }}</span>
    </li>
  </ol>
</template>

<style scoped>
.steps {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}

.step + .step::before {
  width: 28px;
  height: 1px;
  margin: 0 4px 0 12px;
  background: var(--text-dark);
  content: "";
}

.badge {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  box-shadow: inset 0 0 0 1.5px var(--ed-dim);
  font-size: 13px;
  font-weight: 800;
  line-height: 16px;
}

.badge .iconify {
  width: 13px;
  height: 13px;
}

.step.is-done {
  color: var(--ink);
}

.step.is-done .badge {
  box-shadow: inset 0 0 0 1.5px var(--ink);
}

.step.is-current {
  color: var(--ink);
  font-weight: 700;
}

.step.is-current .badge {
  background: var(--acid);
  box-shadow: none;
  color: var(--ink-dark);
}

@media (max-width: 1023.98px) {
  .step + .step::before {
    width: 12px;
    margin: 0 0 0 8px;
  }
}
</style>
