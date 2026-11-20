<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { CSSProperties } from 'vue'
import { FONT_OPTIONS, PATTERN_KINDS, type PatternKind, type ZineElement } from '~/types/zine'
import {
  PAGE_H,
  PAGE_W,
  formatElementSize,
  mmToUnits,
  ptToUnits,
  unitsToMm,
  unitsToPt
} from '~/utils/zineLayout'
import { MIN_PATTERN_SPACING, PATTERN_PRESETS, hasPaint } from '~/utils/zineShapes'
import { useZineStore } from '~/composables/useZineStore'
import ColorPicker from '~/components/zine/ColorPicker.vue'
import PageLayoutPicker from '~/components/zine/PageLayoutPicker.vue'
import {
  useZineElementActions,
  type HorizontalAlignment,
  type VerticalAlignment
} from '~/composables/useZineElementActions.client'

type MeasureKey = 'x' | 'y' | 'width' | 'height'

// A layout added from the catalog; the mobile drawer closes to show it.
const emit = defineEmits<{ 'layout-applied': [] }>()

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 220
const MIN_OPACITY = 10
// Stroke thickness and pattern spacing, in millimetres.
const MIN_STROKE_MM = 0.1
const MAX_STROKE_MM = 5
const MAX_SPACING_MM = 20

// Every `label` below is a key of the `editor.inspector` messages.
const styleItems = ['normal', 'bold', 'italic'] as const

const textAlignItems = [
  { label: 'alignLeft', value: 'left', icon: 'i-lucide-text-align-start' },
  { label: 'alignCenter', value: 'center', icon: 'i-lucide-text-align-center' },
  { label: 'alignRight', value: 'right', icon: 'i-lucide-text-align-end' }
] as const

const horizontalAlignItems = [
  { label: 'pageLeft', value: 'left', icon: 'i-lucide-align-horizontal-justify-start' },
  { label: 'pageCenter', value: 'center', icon: 'i-lucide-align-horizontal-justify-center' },
  { label: 'pageRight', value: 'right', icon: 'i-lucide-align-horizontal-justify-end' }
] satisfies Array<{ label: string, value: HorizontalAlignment, icon: string }>

const lineStyleItems = ['solid', 'dashed', 'dotted'] as const

const patternItems = [
  { value: 'lined', icon: 'i-lucide-align-justify' },
  { value: 'dot-grid', icon: 'i-lucide-grip' },
  { value: 'square-grid', icon: 'i-lucide-grid-3x3' }
] as const satisfies ReadonlyArray<{ value: PatternKind, icon: string }>

const verticalAlignItems = [
  { label: 'pageTop', value: 'top', icon: 'i-lucide-align-vertical-justify-start' },
  { label: 'pageMiddle', value: 'middle', icon: 'i-lucide-align-vertical-justify-center' },
  { label: 'pageBottom', value: 'bottom', icon: 'i-lucide-align-vertical-justify-end' }
] satisfies Array<{ label: string, value: VerticalAlignment, icon: string }>

// Limits in page units, as before; the fields show millimetres.
const measureFields: Array<{ key: MeasureKey, min: number, max: number }> = [
  { key: 'x', min: -PAGE_W, max: PAGE_W * 2 },
  { key: 'y', min: -PAGE_H, max: PAGE_H * 2 },
  { key: 'width', min: 20, max: PAGE_W * 2 },
  { key: 'height', min: 20, max: PAGE_H * 2 }
]

const { t } = useI18n()
const { selectedElement, updateElement } = useZineStore()
const {
  coverPage,
  containPage,
  centerOnPage,
  alignHorizontal,
  alignVertical,
  canAlignHorizontal,
  canAlignVertical,
  isHorizontallyAligned,
  isVerticallyAligned,
  bringForward,
  sendBackward,
  removeSelected
} = useZineElementActions()

// Names the radio groups, so each one is a single Tab stop with arrow keys.
const groupId = useId()

// "Medidas exactas" starts closed.
const measuresOpen = ref(false)

const sizeLabel = computed(() => selectedElement.value
  ? formatElementSize(selectedElement.value.type, selectedElement.value.width, selectedElement.value.height)
  : '')

// A line has a length and no height.
const visibleMeasureFields = computed(() => selectedElement.value?.type === 'line'
  ? measureFields.filter((field) => field.key !== 'height')
  : measureFields)

const isPaintedShape = computed(() => selectedElement.value?.type === 'rect' || selectedElement.value?.type === 'circle')

const opacityPercent = computed(() => Math.round((selectedElement.value?.opacity ?? 1) * 100))
const rotationDegrees = computed(() => Math.round(selectedElement.value?.rotation ?? 0))

const opacityFill = computed<CSSProperties>(() => ({
  '--fill': `${(opacityPercent.value - MIN_OPACITY) / (100 - MIN_OPACITY) * 100}%`
}))

const rotationFill = computed<CSSProperties>(() => ({
  '--fill': `${(rotationDegrees.value + 180) / 360 * 100}%`
}))

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function patch(values: Partial<ZineElement> | Record<string, unknown>) {
  if (!selectedElement.value) return
  updateElement(selectedElement.value.id, values as Partial<ZineElement>)
}

function readNumber(event: Event) {
  const value = Number.parseFloat((event.target as HTMLInputElement).value)
  return Number.isNaN(value) ? null : value
}

// Typing an out-of-range or empty value snaps the field back to what was applied.
function syncField(event: Event, value: number) {
  (event.target as HTMLInputElement).value = String(value)
}

function measureMm(key: MeasureKey) {
  return selectedElement.value ? round1(unitsToMm(selectedElement.value[key])) : 0
}

function setMeasure(field: typeof measureFields[number], event: Event) {
  const millimetres = readNumber(event)

  if (millimetres !== null) {
    patch({ [field.key]: clamp(mmToUnits(millimetres), field.min, field.max) })
  }

  syncField(event, measureMm(field.key))
}

function fontSizePt(element: ZineElement) {
  return element.type === 'text' ? round1(unitsToPt(element.fontSize)) : 0
}

function setFontSize(event: Event) {
  const element = selectedElement.value
  const points = readNumber(event)

  if (points !== null) {
    patch({ fontSize: clamp(ptToUnits(points), MIN_FONT_SIZE, MAX_FONT_SIZE) })
  }

  if (element) syncField(event, fontSizePt(selectedElement.value ?? element))
}

function setOpacity(event: Event) {
  const value = readNumber(event)
  if (value !== null) patch({ opacity: value / 100 })
}

function setRotation(event: Event) {
  const value = readNumber(event)
  if (value !== null) patch({ rotation: value })
}

// X and Y are the same in every language; a line's width is its length.
function measureLabel(key: MeasureKey) {
  if (key === 'x' || key === 'y') return key.toUpperCase()
  if (key === 'width' && selectedElement.value?.type === 'line') return t('editor.inspector.length')
  return t(`editor.inspector.${key}`)
}

function strokeMm(element: ZineElement) {
  return 'strokeWidth' in element ? round2(unitsToMm(element.strokeWidth)) : 0
}

function setStrokeWidth(event: Event) {
  const millimetres = readNumber(event)

  if (millimetres !== null) {
    patch({ strokeWidth: mmToUnits(clamp(millimetres, MIN_STROKE_MM, MAX_STROKE_MM)) })
  }

  if (selectedElement.value) syncField(event, strokeMm(selectedElement.value))
}

function spacingMm(element: ZineElement) {
  return element.type === 'pattern' ? round1(unitsToMm(element.spacing)) : 0
}

function setSpacing(event: Event) {
  const millimetres = readNumber(event)

  if (millimetres !== null) {
    patch({ spacing: clamp(mmToUnits(millimetres), MIN_PATTERN_SPACING, mmToUnits(MAX_SPACING_MM)) })
  }

  if (selectedElement.value) syncField(event, spacingMm(selectedElement.value))
}

function lineStyle(element: ZineElement) {
  return element.type === 'line' ? element.dash ?? 'solid' : 'solid'
}

function setLineStyle(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  patch({ dash: value === 'dashed' || value === 'dotted' ? value : undefined })
}

// Each kind of paper comes with its own spacing, grey and weight: a dot is thicker
// than a rule.
function setPattern(kind: PatternKind) {
  patch({ pattern: kind, ...PATTERN_PRESETS[kind] })
}

function strokeLabel(element: ZineElement) {
  return element.type === 'rect' || element.type === 'circle'
    ? { label: t('editor.inspector.border'), group: t('editor.inspector.borderLabel') }
    : { label: t('editor.inspector.color'), group: t(element.type === 'line' ? 'editor.inspector.lineColorLabel' : 'editor.inspector.patternColorLabel') }
}
</script>

<template>
  <section class="insp" :class="{ 'is-dense': selectedElement && selectedElement.type !== 'image' }">
    <template v-if="!selectedElement">
      <PageLayoutPicker @applied="emit('layout-applied')" />
      <p class="note">
        {{ t('editor.inspector.empty') }}
      </p>
    </template>

    <template v-else-if="selectedElement.type === 'image'">
      <header class="head">
        <h2 class="ed-display">
          {{ t('editor.inspector.image') }}
        </h2>
        <p class="file">
          <span class="file-name">{{ selectedElement.fileName || t('editor.inspector.image') }}</span>
          <span class="file-size"> · {{ selectedElement.naturalWidth }} × {{ selectedElement.naturalHeight }} px</span>
        </p>
      </header>

      <div class="group">
        <h3 class="group-label">
          {{ t('editor.inspector.fitToPage') }}
        </h3>
        <div class="fit">
          <button type="button" class="fit-action" @click="coverPage">
            <UIcon name="i-lucide-expand" aria-hidden="true" />
            {{ t('editor.actions.fill') }}
          </button>
          <button type="button" class="fit-action" @click="containPage">
            <UIcon name="i-lucide-scan" aria-hidden="true" />
            {{ t('editor.actions.fit') }}
          </button>
          <button type="button" class="fit-action" @click="centerOnPage">
            <UIcon name="i-lucide-align-horizontal-justify-center" aria-hidden="true" />
            {{ t('editor.actions.center') }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="selectedElement.type === 'text'">
      <header class="head is-row">
        <h2 class="ed-display">
          {{ t('editor.inspector.text') }}
        </h2>
        <p class="file">
          {{ t('editor.inspector.selected') }}
        </p>
      </header>

      <div class="fonts" role="radiogroup" :aria-label="t('editor.inspector.font')">
        <label
          v-for="font in FONT_OPTIONS"
          :key="font"
          class="font"
          :class="{ 'is-active': selectedElement.fontFamily === font }"
          :style="{ fontFamily: font }"
        >
          <input
            type="radio"
            class="sr-only"
            :name="`${groupId}-font`"
            :checked="selectedElement.fontFamily === font"
            @change="patch({ fontFamily: font })"
          >
          {{ font }}
          <UIcon v-if="selectedElement.fontFamily === font" name="i-lucide-check" aria-hidden="true" />
        </label>
      </div>

      <div class="pair">
        <label class="ed-field">
          <span class="ed-field-label">{{ t('editor.inspector.size') }}</span>
          <span class="ed-field-value">
            <input
              type="number"
              inputmode="decimal"
              step="0.5"
              :min="round1(unitsToPt(MIN_FONT_SIZE))"
              :max="round1(unitsToPt(MAX_FONT_SIZE))"
              :value="fontSizePt(selectedElement)"
              @change="setFontSize"
            >
            <span>pt</span>
          </span>
        </label>

        <label class="ed-field">
          <span class="ed-field-label">{{ t('editor.inspector.style') }}</span>
          <span class="ed-field-value">
            <select
              :value="selectedElement.fontStyle"
              @change="patch({ fontStyle: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="style in styleItems" :key="style" :value="style">
                {{ t(`editor.inspector.styles.${style}`) }}
              </option>
            </select>
          </span>
        </label>
      </div>

      <div class="row">
        <span class="row-label">{{ t('editor.inspector.align') }}</span>
        <div class="switch" role="radiogroup" :aria-label="t('editor.inspector.alignLabel')">
          <label
            v-for="item in textAlignItems"
            :key="item.value"
            class="switch-item"
            :class="{ 'is-active': selectedElement.align === item.value }"
            :title="t(`editor.inspector.${item.label}`)"
          >
            <input
              type="radio"
              class="sr-only"
              :name="`${groupId}-align`"
              :aria-label="t(`editor.inspector.${item.label}`)"
              :checked="selectedElement.align === item.value"
              @change="patch({ align: item.value })"
            >
            <UIcon :name="item.icon" aria-hidden="true" />
          </label>
        </div>
      </div>

      <ColorPicker
        :label="t('editor.inspector.color')"
        :group-label="t('editor.inspector.colorLabel')"
        :model-value="selectedElement.fill"
        @update:model-value="patch({ fill: $event })"
      />
    </template>

    <template v-else>
      <header class="head is-row">
        <h2 class="ed-display">
          {{ t(`editor.shapes.${selectedElement.type}`) }}
        </h2>
        <p class="file">
          {{ t('editor.inspector.selected') }}
        </p>
      </header>

      <div v-if="selectedElement.type === 'pattern'" class="row">
        <span class="row-label">{{ t('editor.inspector.paper') }}</span>
        <div class="switch" role="radiogroup" :aria-label="t('editor.inspector.paperLabel')">
          <label
            v-for="item in patternItems"
            :key="item.value"
            class="switch-item"
            :class="{ 'is-active': selectedElement.pattern === item.value }"
            :title="t(`editor.inspector.patterns.${item.value}`)"
          >
            <input
              type="radio"
              class="sr-only"
              :name="`${groupId}-pattern`"
              :aria-label="t(`editor.inspector.patterns.${item.value}`)"
              :checked="selectedElement.pattern === item.value"
              @change="setPattern(item.value)"
            >
            <UIcon :name="item.icon" aria-hidden="true" />
          </label>
        </div>
      </div>

      <!-- A shape can drop its fill or its border, not both: it would vanish from the page. -->
      <ColorPicker
        v-if="selectedElement.type === 'rect' || selectedElement.type === 'circle'"
        stacked
        :label="t('editor.inspector.fill')"
        :group-label="t('editor.inspector.fillLabel')"
        :none-label="t('editor.inspector.noFill')"
        :none-disabled="!hasPaint(selectedElement.stroke)"
        :model-value="selectedElement.fill"
        @update:model-value="patch({ fill: $event })"
      />

      <ColorPicker
        stacked
        :label="strokeLabel(selectedElement).label"
        :group-label="strokeLabel(selectedElement).group"
        :none-label="isPaintedShape ? t('editor.inspector.noBorder') : undefined"
        :none-disabled="isPaintedShape && 'fill' in selectedElement && !hasPaint(selectedElement.fill)"
        :model-value="selectedElement.stroke"
        @update:model-value="patch({ stroke: $event })"
      />

      <div class="pair">
        <label class="ed-field">
          <span class="ed-field-label">{{ t(selectedElement.type === 'pattern' && selectedElement.pattern === 'dot-grid' ? 'editor.inspector.dotSize' : 'editor.inspector.thickness') }}</span>
          <span class="ed-field-value">
            <input
              type="number"
              inputmode="decimal"
              step="0.1"
              :min="MIN_STROKE_MM"
              :max="MAX_STROKE_MM"
              :value="strokeMm(selectedElement)"
              @change="setStrokeWidth"
            >
            <span>mm</span>
          </span>
        </label>

        <label v-if="selectedElement.type === 'line'" class="ed-field">
          <span class="ed-field-label">{{ t('editor.inspector.style') }}</span>
          <span class="ed-field-value">
            <select :value="lineStyle(selectedElement)" @change="setLineStyle">
              <option v-for="style in lineStyleItems" :key="style" :value="style">
                {{ t(`editor.inspector.lineStyles.${style}`) }}
              </option>
            </select>
          </span>
        </label>

        <label v-else-if="selectedElement.type === 'pattern'" class="ed-field">
          <span class="ed-field-label">{{ t('editor.inspector.spacing') }}</span>
          <span class="ed-field-value">
            <input
              type="number"
              inputmode="decimal"
              step="0.5"
              :min="round1(unitsToMm(MIN_PATTERN_SPACING))"
              :max="MAX_SPACING_MM"
              :value="spacingMm(selectedElement)"
              @change="setSpacing"
            >
            <span>mm</span>
          </span>
        </label>
      </div>
    </template>

    <template v-if="selectedElement">
      <!-- Images, shapes and patterns show their sliders up front; text keeps them under
           "Exact measurements". -->
      <div v-if="selectedElement.type !== 'text'" class="sliders">
        <label class="slider">
          <span class="slider-label">{{ t('editor.inspector.opacity') }}</span>
          <input
            type="range"
            class="ed-range"
            :min="MIN_OPACITY"
            max="100"
            step="1"
            :value="opacityPercent"
            :style="opacityFill"
            @input="setOpacity"
          >
          <span class="slider-value">{{ opacityPercent }}%</span>
        </label>
        <label class="slider">
          <span class="slider-label">{{ t('editor.inspector.rotation') }}</span>
          <input
            type="range"
            class="ed-range"
            min="-180"
            max="180"
            step="1"
            :value="rotationDegrees"
            :style="rotationFill"
            @input="setRotation"
          >
          <span class="slider-value">{{ rotationDegrees }}°</span>
        </label>
      </div>

      <div class="order">
        <button type="button" class="ed-btn-line" @click="bringForward">
          <UIcon name="i-lucide-bring-to-front" aria-hidden="true" />
          {{ t('editor.actions.forward') }}
        </button>
        <button type="button" class="ed-btn-line" @click="sendBackward">
          <UIcon name="i-lucide-send-to-back" aria-hidden="true" />
          {{ t('editor.actions.backward') }}
        </button>
        <button
          v-if="selectedElement.type !== 'image'"
          type="button"
          class="ed-btn-line is-danger is-icon"
          :aria-label="t('editor.actions.delete')"
          :title="t('editor.actions.delete')"
          @click="removeSelected('inspector')"
        >
          <UIcon name="i-lucide-trash-2" aria-hidden="true" />
        </button>
      </div>

      <div class="measures">
        <button
          type="button"
          class="measures-toggle"
          :aria-expanded="measuresOpen"
          aria-controls="ed-measures"
          @click="measuresOpen = !measuresOpen"
        >
          <span class="measures-title">
            <UIcon name="i-lucide-chevron-right" :class="{ 'is-open': measuresOpen }" aria-hidden="true" />
            {{ t('editor.inspector.measures') }}
          </span>
          <span class="measures-summary">{{ sizeLabel }}</span>
        </button>

        <div v-if="measuresOpen" id="ed-measures" class="measures-body">
          <div class="pair is-grid">
            <label v-for="field in visibleMeasureFields" :key="field.key" class="ed-field">
              <span class="ed-field-label">{{ measureLabel(field.key) }}</span>
              <span class="ed-field-value">
                <input
                  type="number"
                  inputmode="decimal"
                  step="1"
                  :value="measureMm(field.key)"
                  @change="setMeasure(field, $event)"
                >
                <span>mm</span>
              </span>
            </label>
          </div>

          <div v-if="selectedElement.type === 'text'" class="sliders">
            <label class="slider">
              <span class="slider-label">{{ t('editor.inspector.opacity') }}</span>
              <input
                type="range"
                class="ed-range"
                :min="MIN_OPACITY"
                max="100"
                step="1"
                :value="opacityPercent"
                :style="opacityFill"
                @input="setOpacity"
              >
              <span class="slider-value">{{ opacityPercent }}%</span>
            </label>
            <label class="slider">
              <span class="slider-label">{{ t('editor.inspector.rotation') }}</span>
              <input
                type="range"
                class="ed-range"
                min="-180"
                max="180"
                step="1"
                :value="rotationDegrees"
                :style="rotationFill"
                @input="setRotation"
              >
              <span class="slider-value">{{ rotationDegrees }}°</span>
            </label>
          </div>

          <div class="row">
            <span class="row-label">{{ t('editor.inspector.horizontal') }}</span>
            <div class="switch" role="group" :aria-label="t('editor.inspector.horizontalLabel')">
              <button
                v-for="item in horizontalAlignItems"
                :key="item.value"
                type="button"
                class="switch-item"
                :class="{ 'is-active': isHorizontallyAligned(item.value) }"
                :aria-pressed="isHorizontallyAligned(item.value)"
                :aria-label="t(`editor.inspector.${item.label}`)"
                :title="t(`editor.inspector.${item.label}`)"
                :disabled="!canAlignHorizontal()"
                @click="alignHorizontal(item.value)"
              >
                <UIcon :name="item.icon" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="row">
            <span class="row-label">{{ t('editor.inspector.vertical') }}</span>
            <div class="switch" role="group" :aria-label="t('editor.inspector.verticalLabel')">
              <button
                v-for="item in verticalAlignItems"
                :key="item.value"
                type="button"
                class="switch-item"
                :class="{ 'is-active': isVerticallyAligned(item.value) }"
                :aria-pressed="isVerticallyAligned(item.value)"
                :aria-label="t(`editor.inspector.${item.label}`)"
                :title="t(`editor.inspector.${item.label}`)"
                :disabled="!canAlignVertical()"
                @click="alignVertical(item.value)"
              >
                <UIcon :name="item.icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.insp {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--ink-dark);
}

/* The text and shape panels are denser than the image one. */
.insp.is-dense {
  gap: 14px;
}

.note {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--text-dark);
  background: #fbf7c9;
  color: var(--text-dark);
  font-size: 15px;
  line-height: 1.5;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head.is-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.file {
  display: flex;
  min-width: 0;
  margin: 0;
  color: var(--text-dark);
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
  white-space: pre;
}

.file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  flex: none;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-label {
  margin: 0;
  color: var(--text-dark);
  font-size: 13px;
  font-weight: 700;
  line-height: 16px;
}

.fit {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.fit-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 11px 5px;
  border: 1px solid var(--ink-dark);
  background: transparent;
  color: var(--ink-dark);
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
  transition:
    background 180ms ease,
    color 180ms ease;
}

.fit-action:hover {
  background: var(--ink-dark);
  color: var(--ink);
}

.fit-action .iconify {
  width: 18px;
  height: 18px;
}

/* Sliders */

.sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 28px;
}

.slider-label {
  flex: none;
  width: 68px;
  color: var(--text-dark);
  font-size: 13px;
  font-weight: 700;
}

.slider-value {
  flex: none;
  width: 44px;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Order and delete */

.order {
  display: flex;
  gap: 8px;
}

.order .ed-btn-line {
  flex: 1 1 0;
}

.order .ed-btn-line.is-icon {
  flex: none;
  width: 40px;
}

/* Font list */

.fonts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* The font and alignment options are labels around hidden radio inputs: the label
   shows the focus ring its input cannot. */
.font:has(:focus-visible),
.switch-item:has(:focus-visible) {
  outline: 2px solid var(--ed-focus);
  outline-offset: 2px;
}

.font {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 11px;
  border: 1px solid var(--ed-hairline);
  background: #fff;
  color: var(--ink-dark);
  font-size: 16px;
  line-height: 1;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease;
}

.font:hover {
  border-color: var(--ink-dark);
}

.font.is-active {
  border-color: var(--ink-dark);
  background: var(--acid);
  box-shadow: inset 0 0 0 0.5px var(--ink-dark);
}

.font .iconify {
  width: 16px;
  height: 16px;
}

/* Two fields side by side */

.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* Label + control rows */

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-label {
  flex: none;
  min-width: 64px;
  color: var(--ed-label);
  font-size: 13px;
  font-weight: 700;
}

.switch {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  height: 40px;
  border: 1px solid var(--ed-hairline);
  background: #fff;
}

.switch-item {
  position: relative;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
  cursor: pointer;
  transition:
    background 180ms ease,
    color 180ms ease;
}

.switch-item:hover:not(:disabled, .is-active) {
  background: rgb(11 10 9 / 8%);
}

.switch-item.is-active {
  background: var(--ink-dark);
  color: var(--ink);
}

.switch-item:disabled {
  opacity: 0.35;
}

.switch-item .iconify {
  width: 18px;
  height: 18px;
}

/* Medidas exactas */

.measures {
  border-block: 1px solid var(--ed-hairline);
}

.measures-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 0;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
}

.measures-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  line-height: 16px;
}

.measures-title .iconify {
  width: 16px;
  height: 16px;
  transition: transform 180ms ease;
}

.measures-title .iconify.is-open {
  transform: rotate(90deg);
}

.measures-summary {
  color: var(--text-dark);
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
}

.measures-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 14px;
}
</style>
