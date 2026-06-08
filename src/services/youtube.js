const BASE = 'https://www.googleapis.com/youtube/v3'

function apiKey() {
  return localStorage.getItem('yt_api_key') || ''
}

export async function fetchChannelStats(channelId) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  const url = `${BASE}/channels?part=statistics,snippet&id=${channelId}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YT_API_ERROR:${res.status}`)
  const json = await res.json()

  if (!json.items?.length) throw new Error('CHANNEL_NOT_FOUND')
  const { statistics, snippet } = json.items[0]
  return {
    channelId,
    title: snippet.title,
    thumbnail: snippet.thumbnails?.default?.url,
    subscribers: Number(statistics.subscriberCount),
    totalViews: Number(statistics.viewCount),
    videoCount: Number(statistics.videoCount),
  }
}

export async function fetchRecentVideos(channelId, maxResults = 20) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  const chanUrl = `${BASE}/channels?part=contentDetails&id=${channelId}&key=${key}`
  const chanRes = await fetch(chanUrl)
  const chanJson = await chanRes.json()
  const playlistId = chanJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) throw new Error('PLAYLIST_NOT_FOUND')

  const plUrl = `${BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${key}`
  const plRes = await fetch(plUrl)
  const plJson = await plRes.json()
  const videoIds = plJson.items?.map(i => i.contentDetails.videoId).join(',')
  if (!videoIds) return []

  const vidUrl = `${BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${key}`
  const vidRes = await fetch(vidUrl)
  const vidJson = await vidRes.json()

  return (vidJson.items || []).map(v => ({
    videoId: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    publishedAt: v.snippet.publishedAt,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    comments: Number(v.statistics.commentCount || 0),
    duration: v.contentDetails.duration,
  }))
}

export async function searchChannel(query) {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY')

  const url = `${BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=5&key=${key}`
  const res = await fetch(url)
  const json = await res.json()
  return (json.items || []).map(i => ({
    channelId: i.snippet.channelId,
    title: i.snippet.channelTitle,
    thumbnail: i.snippet.thumbnails?.default?.url,
  }))
}
