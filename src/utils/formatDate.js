export function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function formatDateShort(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function isWithinDays(isoString, days) {
  const cutoff = Date.now() - days * 86400 * 1000
  return new Date(isoString).getTime() > cutoff
}
