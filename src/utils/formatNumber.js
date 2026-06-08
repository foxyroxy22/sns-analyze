export function formatNumber(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export function formatDelta(n) {
  if (n == null) return ''
  return (n >= 0 ? '▲ +' : '▼ ') + formatNumber(Math.abs(n))
}
