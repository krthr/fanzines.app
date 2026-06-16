import { PAGE_MESSAGE_KEYS, type PageId } from '~/types/zine'

export function useZinePageLabels() {
  const { t } = useI18n()

  function pageLabel(pageId: PageId) {
    return t(`pages.${PAGE_MESSAGE_KEYS[pageId]}.label`)
  }

  function pageShortLabel(pageId: PageId) {
    return t(`pages.${PAGE_MESSAGE_KEYS[pageId]}.short`)
  }

  function sheetPageLabel(pageId: PageId) {
    if (pageId === 'front-cover' || pageId === 'back-cover') {
      return pageLabel(pageId)
    }

    return t('pages.sheetPageLabel', { number: pageId.slice(1) })
  }

  return {
    pageLabel,
    pageShortLabel,
    sheetPageLabel
  }
}
