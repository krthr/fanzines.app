import { getPageNumber, type PageId } from '~/types/zine'

type PageNameForm = 'label' | 'name' | 'place'

// The names of the eight pages in the current language.
export function useZinePageLabels() {
  const { t } = useI18n()

  function named(form: PageNameForm, pageId: PageId) {
    if (pageId === 'front-cover') return t(`pages.${form}.frontCover`)
    if (pageId === 'back-cover') return t(`pages.${form}.backCover`)
    return t(`pages.${form}.inner`, { n: getPageNumber(pageId) })
  }

  // "Portada", "Página 1": a heading or an accessible name.
  const pageLabel = (pageId: PageId) => named('label', pageId)

  // "portada", "página 1": inside a phrase, as in "Editar página 1".
  const pageName = (pageId: PageId) => named('name', pageId)

  // "la portada", "la página 1": where something goes.
  const pagePlace = (pageId: PageId) => named('place', pageId)

  // "Portada", "1", "Contra": under a thumbnail.
  function pageShortLabel(pageId: PageId) {
    if (pageId === 'front-cover') return t('pages.short.frontCover')
    if (pageId === 'back-cover') return t('pages.short.backCover')
    return String(getPageNumber(pageId))
  }

  return {
    pageLabel,
    pageName,
    pagePlace,
    pageShortLabel
  }
}
