<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useZineExport } from '~/composables/useZineExport.client'
import ZineToggle from '~/components/zine/ZineToggle.vue'

// The right panel in review: what the sheet holds and the two PDF options.
const { t } = useI18n()
const { state } = useZineStore()
const { filledPageIds } = useZineEditorView()
const { exportError } = useZineExport()

const allFilled = computed(() => filledPageIds.value.length === PAGE_IDS.length)
</script>

<template>
  <section class="review">
    <div class="block">
      <h2 class="ed-display">
        {{ t('editor.review.title') }}
      </h2>
      <ul class="checks">
        <li class="check" :class="{ 'is-pending': !allFilled }">
          <UIcon :name="allFilled ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'" aria-hidden="true" />
          {{ t('editor.review.filled', { filled: filledPageIds.length, total: PAGE_IDS.length }) }}
        </li>
        <li class="check">
          <UIcon name="i-lucide-circle-check" aria-hidden="true" />
          {{ t('editor.review.order') }}
        </li>
      </ul>
    </div>

    <hr class="divider">

    <div class="block is-options">
      <h2 class="ed-display">
        {{ t('editor.review.options') }}
      </h2>
      <div class="option">
        <ZineToggle v-model="state.exportGuides">
          {{ t('editor.review.guides') }}
        </ZineToggle>
        <p>{{ t('editor.review.guidesHelp') }}</p>
      </div>
      <div class="option">
        <ZineToggle v-model="state.exportSafeMargins">
          {{ t('editor.review.safeMargin') }}
        </ZineToggle>
        <p>{{ t('editor.review.safeMarginHelp') }}</p>
      </div>
    </div>

    <p v-if="exportError" class="error" role="alert">
      <UIcon name="i-lucide-triangle-alert" aria-hidden="true" />
      {{ exportError }}
    </p>
  </section>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--ink-dark);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block.is-options {
  gap: 14px;
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.check .iconify {
  flex: none;
  width: 16px;
  height: 16px;
  color: #2e7d4f;
}

.check.is-pending .iconify {
  color: var(--text-dark);
}

.divider {
  height: 1px;
  margin: 0;
  border: 0;
  background: rgb(11 10 9 / 15%);
}

.option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option p {
  margin: 0;
  color: var(--text-dark);
  font-size: 13px;
  line-height: 1.4;
}

.error {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--orange-deep);
  background: #f6ddd2;
  color: var(--ink-dark);
  font-size: 13px;
  line-height: 1.4;
}

.error .iconify {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  color: var(--orange-deep);
}
</style>
