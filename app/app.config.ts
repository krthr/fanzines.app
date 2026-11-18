export default defineAppConfig({
  ui: {
    colors: {
      primary: 'lime',
      secondary: 'cyan',
      neutral: 'stone',
      error: 'red',
      warning: 'amber',
      info: 'cyan',
      success: 'emerald'
    },
    // Toasts are cream paper with a hard orange shadow, whatever their colour.
    toast: {
      slots: {
        root: 'overflow-visible rounded-none border-2 border-(--ink-dark) bg-(--ink) p-3.5 shadow-[6px_6px_0_var(--orange)] ring-0 gap-3',
        title: 'text-[15px] leading-[19px] font-bold text-(--ink-dark)',
        description: 'text-[13px] leading-[1.4] text-(--text-dark)',
        close: 'text-(--text-dark) hover:text-(--ink-dark) hover:bg-transparent [&_.iconify]:size-4'
      },
      variants: {
        title: {
          true: {
            description: 'mt-3'
          }
        }
      }
    },
    toaster: {
      slots: {
        viewport: 'sm:w-[296px] bottom-5! font-(family-name:--font-body)'
      },
      variants: {
        position: {
          'bottom-right': {
            viewport: 'right-3'
          }
        }
      }
    }
  }
})
