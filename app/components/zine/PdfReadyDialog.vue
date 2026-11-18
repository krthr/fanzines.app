<script setup lang="ts">
import { useZineExport } from '~/composables/useZineExport.client'

// Shown after a successful export: how to print and fold the sheet.
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'download-again': []
  'back-to-editor': []
}>()

const { isExporting, exportError } = useZineExport()
</script>

<template>
  <UModal
    v-model:open="open"
    title="Tu fanzine está listo"
    description="El PDF se ha descargado. Imprímelo a tamaño real, córtalo y dóblalo."
    :ui="{
      overlay: 'pdf-ready-overlay',
      content: 'pdf-ready-content ed-light'
    }"
  >
    <template #content>
      <div class="ready">
        <div class="preview">
          <img
            src="/images/fold-guide.webp"
            alt="Instrucciones dibujadas a mano para doblar, cortar y abrir el fanzine"
            width="392"
            height="294"
          >
          <p class="file">
            <UIcon name="i-lucide-file-text" aria-hidden="true" />
            fanzine-a4.pdf
          </p>
        </div>

        <div class="content">
          <p class="sticker">
            PDF descargado
          </p>
          <h2 class="title">
            <span>Tu fanzine</span>
            <span>está listo.</span>
          </h2>

          <div class="callout">
            <UIcon name="i-lucide-printer" aria-hidden="true" />
            <div>
              <p class="callout-title">
                Imprime a tamaño real (100%)
              </p>
              <p class="callout-text">
                Desactiva «Ajustar a la página». Si se reduce, las páginas no encajan al doblar.
              </p>
            </div>
          </div>

          <ol class="steps">
            <li>Dobla a lo largo y corta solo la línea roja central.</li>
            <li>Abre, empuja hacia el centro y dobla como un libro.</li>
          </ol>

          <p v-if="exportError" class="error" role="alert">
            {{ exportError }}
          </p>

          <div class="buttons">
            <button
              type="button"
              class="ed-btn-primary is-tall"
              :disabled="isExporting"
              @click="emit('download-again')"
            >
              Descargar otra vez
              <UIcon
                :name="isExporting ? 'i-lucide-loader-circle' : 'i-lucide-download'"
                :class="{ 'is-spinning': isExporting }"
                aria-hidden="true"
              />
            </button>
          </div>

          <button type="button" class="back" @click="emit('back-to-editor')">
            <UIcon name="i-lucide-arrow-left" aria-hidden="true" />
            Volver al editor
          </button>
        </div>

        <button type="button" class="close" aria-label="Cerrar" @click="open = false">
          <UIcon name="i-lucide-x" aria-hidden="true" />
        </button>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.ready {
  position: relative;
  display: grid;
  grid-template-columns: 440px minmax(0, 1fr);
  min-height: 580px;
  /* The frame's 2px stroke sits inside the 920 × 580 box. */
  outline: 2px solid var(--ink-dark);
  outline-offset: -2px;
  color: var(--ink-dark);
  font-family: var(--font-body);
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px 22px 24px 24px;
  border-right: 2px solid var(--ink-dark);
  background: #fff;
}

.preview img {
  width: 100%;
  max-width: 392px;
  height: auto;
}

.file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
}

.file .iconify {
  width: 16px;
  height: 16px;
  color: var(--orange);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  padding: 32px;
}

.sticker {
  /* The tilt makes it taller than its box; the margin keeps the column where the frame has it. */
  margin: 2px 0;
  padding: 5px 10px;
  background: var(--acid);
  font-family: var(--font-type);
  font-size: 14px;
  line-height: 14px;
  transform: rotate(2deg);
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 400;
  line-height: 0.95;
  text-transform: uppercase;
}

.title span {
  display: block;
}

.callout {
  display: flex;
  align-self: stretch;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--ink-dark);
  background: var(--acid);
}

.callout .iconify {
  flex: none;
  width: 22px;
  height: 22px;
}

.callout-title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 800;
  line-height: 21px;
}

.callout-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.steps {
  display: flex;
  align-self: stretch;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  color: var(--text-dark);
  counter-reset: fold;
  font-size: 15px;
  line-height: 1.4;
  list-style: none;
}

.steps li {
  display: flex;
  align-items: center;
  gap: 12px;
  counter-increment: fold;
}

.steps li::before {
  display: grid;
  flex: none;
  width: 26px;
  height: 26px;
  place-items: center;
  background: var(--ink-dark);
  color: var(--ink);
  content: counter(fold);
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--orange-deep);
  background: #f6ddd2;
  font-size: 13px;
  line-height: 1.4;
}

.buttons {
  padding-top: 8px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-dark);
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-underline-offset: 4px;
}

.back:hover {
  color: var(--ink-dark);
  text-decoration: underline;
}

.back .iconify {
  width: 15px;
  height: 15px;
}

.close {
  position: absolute;
  top: 12px;
  right: 8px;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
}

.close:hover {
  background: rgb(11 10 9 / 8%);
}

.close .iconify {
  width: 18px;
  height: 18px;
}

.is-spinning {
  animation: ready-spin 900ms linear infinite;
}

@keyframes ready-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1023.98px) {
  .ready {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .preview {
    padding: 20px 56px 16px;
    border-right: 0;
    border-bottom: 2px solid var(--ink-dark);
  }

  .preview img {
    max-width: 260px;
  }

  .content {
    gap: 16px;
    padding: 20px;
  }

  .title {
    font-size: 40px;
  }
}
</style>

<style>
/* The dialog is teleported to <body>, outside the editor shell and this component's scope. */
.pdf-ready-overlay {
  background: rgb(11 10 9 / 80%);
  backdrop-filter: blur(4px);
}

.pdf-ready-content {
  width: min(920px, 100vw - 32px);
  max-width: none;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  border-radius: 0;
  background: var(--ink);
  box-shadow: 12px 12px 0 var(--orange);
}
</style>
