import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import HeatmapGrid from '../components/HeatmapGrid'
import PostCard from '../components/PostCard'
import FilterChip from '../components/FilterChip'
import Toast from '../components/Toast'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'
import { readCache, writeCache } from '../hooks/useCache'
import { calcBestUploadTime } from '../utils/calcBestUploadTime'
import { formatDateShort, isWithinDays } from '../utils/formatDate'

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

export default function InstagramPage() {
  const [profile, setProfile] = useState(null)
  const [media, setMedia]     = useState([])
  const [period, setPeriod]   = useState(30)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let p = readCache('ig_profile')
        if (!p) { p = await fetchIGProfile(); writeCache('ig_profile', p) }
        setProfile(p)

        let m = readCache('ig_media')
        if (!m) { m = await fetchIGMedia(50); writeCache('ig_media', m) }
        setMedia(m)
      } catch (e) {
        setToast({
          message: e.message === 'TOKEN_EXPIRED' ? 'Instagram 토큰 만료' : 'Instagram 로드 실패',
          type: 'error',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  // Save today's follower snapshot
  useEffect(() => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const existing = JSON.parse(localStorage.getItem('ig_history') || '[]')
    if (!existing.find(h => h.date === today)) {
      existing.push({ date: today, followers: profile.followers_count })
      if (existing.length > 365) existing.shift()
      localStorage.setItem('ig_history', JSON.stringify(existing))
    }
  }, [profile])

  const filtered = media.filter(p => isWithinDays(p.timestamp, period))

  // Follower history chart
  const history = JSON.parse(localStorage.getItem('ig_history') || '[]')
  const chartLabels = history.slice(-Math.min(period, history.length)).map(h => formatDateShort(h.date))
  const chartValues = history.slice(-Math.min(period, history.length)).map(h => h.followers)

  // Engagement bar chart (top 10 posts)
  const engagementData = filtered.slice(0, 10).map(p => ({
    label: formatDateShort(p.timestamp),
    value: (p.like_count || 0) + (p.comments_count || 0),
  }))

  // Heatmap
  const heatmapPosts = filtered.map(p => ({
    timestamp: p.timestamp,
    engagement: (p.like_count || 0) + (p.comments_count || 0),
  }))
  const heatmatrix = calcBestUploadTime(heatmapPosts)

  if (loading) {
    return <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="INSTAGRAM" ko="인스타그램 분석" />

      <div className="grid grid-cols-2 gap-px bg-white/10 mx-5 mt-5 mb-5">
        <StatCard label="팔로워" value={profile?.followers_count} />
        <StatCard label="게시물 수" value={profile?.media_count} />
      </div>

      <div className="px-5 mb-4">
        <FilterChip options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      {chartValues.length > 1 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">FOLLOWER TREND</div>
          <LineChart labels={chartLabels} values={chartValues} color="#0033FF" />
        </div>
      )}

      {engagementData.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">ENGAGEMENT PER POST</div>
          <BarChart
            labels={engagementData.map(d => d.label)}
            values={engagementData.map(d => d.value)}
            color="#FFEE00"
          />
        </div>
      )}

      {heatmapPosts.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">BEST UPLOAD TIME</div>
          <HeatmapGrid matrix={heatmatrix} />
        </div>
      )}

      <div className="px-5 mb-5">
        <div className="heading-en text-xs text-white/40 mb-2">RECENT POSTS ({filtered.length})</div>
        {filtered.map(p => (
          <PostCard
            key={p.id}
            thumbnail={p.thumbnail_url || p.media_url}
            timestamp={p.timestamp}
            metrics={[
              { label: 'LIKES', value: p.like_count },
              { label: 'COMMENTS', value: p.comments_count },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
