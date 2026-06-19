export default defineEventHandler((event) => {
  const host = getRequestHost(event).toLowerCase()
  if (host !== 'www.fanzines.app') return

  const url = getRequestURL(event)
  url.host = 'fanzines.app'
  url.protocol = 'https:'
  return sendRedirect(event, url.toString(), 301)
})
