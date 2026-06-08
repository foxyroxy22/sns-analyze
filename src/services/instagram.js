const BASE = 'https://graph.instagram.com'

function token() {
  return localStorage.getItem('ig_access_token') || ''
}

export async function fetchIGProfile() {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const url = `${BASE}/me?fields=id,username,followers_count,media_count&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    if (err.error?.code === 190) throw new Error('TOKEN_EXPIRED')
    throw new Error(`IG_API_ERROR:${res.status}`)
  }
  return res.json()
}

export async function fetchIGMedia(limit = 20) {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const fields = 'id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count'
  const url = `${BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`IG_API_ERROR:${res.status}`)
  const json = await res.json()
  return json.data || []
}

export async function fetchIGInsights(mediaId) {
  const t = token()
  if (!t) throw new Error('NO_ACCESS_TOKEN')

  const url = `${BASE}/${mediaId}/insights?metric=reach,saved,impressions&access_token=${t}`
  const res = await fetch(url)
  if (!res.ok) return { reach: 0, saved: 0, impressions: 0 }
  const json = await res.json()
  const result = {}
  for (const item of json.data || []) {
    result[item.name] = item.values?.[0]?.value ?? 0
  }
  return result
}
