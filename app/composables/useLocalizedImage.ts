// Images with lettering in them (the editor screenshot, the fold guide, the social card)
// have an English twin next to the Spanish original, named with an -en suffix.
export function useLocalizedImage() {
  const { locale } = useI18n()

  return (path: string) => locale.value === 'en' ? path.replace(/(\.\w+)$/, '-en$1') : path
}
