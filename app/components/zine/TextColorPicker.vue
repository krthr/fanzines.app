<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { TEXT_COLOR_OPTIONS } from '~/types/zine'

type PresetColor = typeof TEXT_COLOR_OPTIONS[number]

// Every value is a key of the `editor.inspector.colors` messages.
const colorNames: Record<PresetColor, string> = {
  '#0b0a09': 'black',
  '#ffffff': 'white',
  '#d25a36': 'orange',
  '#e9ff5c': 'acid',
  '#2f5bea': 'blue'
}

// Below this luminance the palette icon on the custom swatch turns cream: from here
// down, cream contrasts more than ink with the colour behind it.
const DARK_COLOR_LUMINANCE = 0.18

// The text's fill. Colours are stored as lowercase '#rrggbb', like the presets.
const color = defineModel<string>({ required: true })

const { t } = useI18n()
const id = useId()
const panelId = `${id}-custom`

const customOpen = ref(false)
const customButton = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

// '#abc', 'abc', '#aabbcc' or 'aabbcc', in any case, becomes '#aabbcc'.
function parseHex(value: string) {
  const digits = value.trim().replace(/^#/, '').toLowerCase()
  if (/^[\da-f]{3}$/.test(digits)) return `#${[...digits].map(digit => digit + digit).join('')}`
  return /^[\da-f]{6}$/.test(digits) ? `#${digits}` : null
}

function luminance(hex: string) {
  const channel = (start: number) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

const currentHex = computed(() => parseHex(color.value))
const isCustom = computed(() => !TEXT_COLOR_OPTIONS.some(preset => preset === color.value.toLowerCase()))
const hexLabel = computed(() => currentHex.value?.toUpperCase() ?? color.value)

const customLabel = computed(() => isCustom.value
  ? t('editor.inspector.colors.customSelected', { hex: hexLabel.value })
  : t('editor.inspector.colors.custom'))

const customStyle = computed(() => isCustom.value ? { background: color.value } : undefined)
const customOnDark = computed(() => isCustom.value
  && currentHex.value !== null
  && luminance(currentHex.value) < DARK_COLOR_LUMINANCE)

// UColorPicker writes back, slightly rounded, every colour it is handed. It is remounted
// when the colour comes from anywhere else (a swatch, the hex field, another text), so
// only a drag in the picker ever changes the text.
const pickerKey = ref(0)
let pickedColor: string | null = null

watch(() => color.value.toLowerCase(), (value) => {
  if (value !== pickedColor) pickerKey.value++
})

function choose(value: string) {
  if (value !== color.value) color.value = value
}

function pick(value: string | undefined) {
  const hex = value ? parseHex(value) : null
  if (!hex) return

  pickedColor = hex
  choose(hex)
}

function presetLabel(preset: PresetColor) {
  return t(`editor.inspector.colors.${colorNames[preset]}`)
}

// The field applies a colour as soon as its six digits are in; shorter codes wait for
// Enter or for the field to lose focus.
function onHexInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.value.trim().replace(/^#/, '').length !== 6) return

  const hex = parseHex(input.value)
  if (hex) choose(hex)
}

// A code that isn't a colour snaps back to the one applied.
function onHexChange(event: Event) {
  const input = event.target as HTMLInputElement
  const hex = parseHex(input.value)

  if (hex) choose(hex)
  input.value = (hex ?? currentHex.value ?? color.value).toUpperCase()
}

async function toggleCustom() {
  customOpen.value = !customOpen.value
  if (!customOpen.value) return

  await nextTick()
  panel.value?.scrollIntoView({ block: 'nearest' })
}

// Esc closes the picker before it reaches the editor, where it would drop the selection
// (or, on mobile, close the drawer).
function closeCustom(event: KeyboardEvent) {
  if (!customOpen.value) return

  event.stopPropagation()
  customOpen.value = false
  customButton.value?.focus()
}
</script>

<template>
  <div class="text-color">
    <div class="row">
      <span class="row-label">{{ t('editor.inspector.color') }}</span>
      <div class="swatches">
        <div class="presets" role="radiogroup" :aria-label="t('editor.inspector.colorLabel')">
          <label
            v-for="preset in TEXT_COLOR_OPTIONS"
            :key="preset"
            class="swatch"
            :class="{ 'is-active': color.toLowerCase() === preset }"
            :title="presetLabel(preset)"
          >
            <input
              type="radio"
              class="sr-only"
              :name="`${id}-color`"
              :aria-label="presetLabel(preset)"
              :checked="color.toLowerCase() === preset"
              @change="choose(preset)"
            >
            <span :style="{ background: preset }" />
          </label>
        </div>

        <button
          ref="customButton"
          type="button"
          class="swatch is-custom"
          :class="{ 'is-active': isCustom, 'is-on-dark': customOnDark }"
          :aria-label="customLabel"
          :title="t('editor.inspector.colors.custom')"
          :aria-expanded="customOpen"
          :aria-controls="panelId"
          @click="toggleCustom"
          @keydown.esc="closeCustom"
        >
          <span :style="customStyle">
            <UIcon name="i-lucide-palette" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>

    <!-- Dragging in the picker must not drag the mobile drawer with it. -->
    <div
      v-if="customOpen"
      :id="panelId"
      ref="panel"
      class="custom"
      role="group"
      :aria-label="t('editor.inspector.colors.custom')"
      data-vaul-no-drag
      @keydown.esc="closeCustom"
    >
      <!-- Pointer and touch only: the hex field below is the keyboard's way in. -->
      <UColorPicker
        :key="pickerKey"
        class="picker"
        :model-value="currentHex ?? color"
        @update:model-value="pick"
      />

      <label class="ed-field">
        <span class="ed-field-label">{{ t('editor.inspector.hex') }}</span>
        <span class="ed-field-value">
          <input
            type="text"
            maxlength="7"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="characters"
            :value="hexLabel"
            @input="onHexInput"
            @change="onHexChange"
          >
        </span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.text-color {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  flex: none;
  color: var(--ed-label);
  font-size: 13px;
  font-weight: 700;
}

/* Six equal squares: 34px in the desktop inspector, up to 40px on a phone. The presets
   keep their own radiogroup box and line up with the custom swatch through subgrid. */
.swatches {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(6, minmax(0, 40px));
  gap: 6px;
}

.presets {
  display: grid;
  grid-column: span 5;
  grid-template-columns: subgrid;
}

.swatch {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
}

/* The presets are labels around hidden radio inputs: the label shows the focus ring
   its input cannot. The custom swatch is a button and gets the editor's own ring. */
.swatch:has(:focus-visible) {
  outline: 2px solid var(--ed-focus);
  outline-offset: 2px;
}

.swatch span {
  display: block;
  width: 100%;
  height: 100%;
  border: 1px solid var(--ed-hairline);
}

/* A sliver of paper between the frame and the colour, so black reads as selected too. */
.swatch.is-active {
  padding: 1px;
  border-color: var(--ink-dark);
}

/* Before a custom colour is chosen, the swatch is an empty slot with a palette. */
.swatch.is-custom span {
  display: grid;
  place-items: center;
  border: 1px dashed var(--ed-label);
  color: var(--ink-dark);
  transition: border-color 180ms ease;
}

.swatch.is-custom:hover:not(.is-active) span {
  border-color: var(--ink-dark);
}

.swatch.is-custom.is-active span {
  border: 1px solid var(--ed-hairline);
}

.swatch.is-custom.is-on-dark span {
  color: var(--ink);
}

.swatch.is-custom .iconify {
  width: 16px;
  height: 16px;
}

/* Custom colour */

.custom {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picker :deep([data-slot="picker"]) {
  gap: 10px;
}

.picker :deep([data-slot="selector"]),
.picker :deep([data-slot="track"]) {
  height: 160px;
  border: 1px solid var(--ed-hairline);
  border-radius: 0;
  background-clip: padding-box;
  cursor: pointer;
}

.picker :deep([data-slot="selector"]) {
  flex: 1;
  width: auto;
}

.picker :deep([data-slot="selectorBackground"]) {
  border-radius: 0;
}

.picker :deep([data-slot="track"]) {
  flex: none;
  width: 18px;
}

/* Square knobs like the editor's sliders: ink frame for light colours, paper ring for
   dark ones. */
.picker :deep([data-slot="selectorThumb"]),
.picker :deep([data-slot="trackThumb"]) {
  width: 18px;
  height: 18px;
  border: 2px solid var(--ink-dark);
  border-radius: 0;
  box-shadow: 0 0 0 2px #fff;
}

.picker :deep([data-slot="trackThumb"]) {
  left: -1px;
  translate: 0 -50%;
}

.custom .ed-field input {
  text-transform: uppercase;
}
</style>
