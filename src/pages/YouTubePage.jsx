import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import HeatmapGrid from '../components/HeatmapGrid'
import PostCard from '../components/PostCard'
import FilterChip from '../components/FilterChip'
import Toast from '../components/Toast'
import { fetchChannelStats, fetchRecentVideos } from '../services/youtube'
import { readCache, writeCache } from '../hooks/useCache'
import { calcBestUploadTime } from '../utils/calcBestUploadTime'
import { formatDateShort, isWithinDays } from '../utils/formatDate'

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

export default function YouTubePage() {
  const [stats, setStats]   = useState(null)
  const [videos, setVideos] = useState([])
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]   = useState(null)

  const channelId = localStorage.getItem('yt_channel_id')

  useEffect(() => {
    async function load() {
      if (!channelId) {
        setLoading(false)
        setToast({ message: '채널 ID를 설정에서 입력하세요', type: 'error' })
        return
      }
      setLoading(true)
      try {
        let s = readCache('yt_stats')
        if (!s) { s = await fetchChannelStats(channelId); writeCache('yt_stats', s) }
        setStats(s)

        let v = readCache('yt_videos')
        if (!v) { v = await fetchRecentVideos(channelId, 50); writeCache('yt_videos', v) }
        setVideos(v)
      } catch (e) {
        setToast({ message: 'YouTube 로드 실패 — 캐시 사용 중', type: 'error' })
      }
      setLoading(false)
    }
    load()
  }, [])

  // Save today's subscriber snapshot
  useEffect(() => {
    if (!stats) return
    const today = new Date().toISOString().split('T')[0]
    const existing = JSON.parse(localStorage.getItem('yt_history') || '[]')
    if (!existing.find(h => h.date === today)) {
      existing.push({ date: today, subscribers: stats.subscribers })
      if (existing.length > 365) existing.shift()
      localStorage.setItem('yt_history', JSON.stringify(existing))
    }
  }, [stats])

  const filtered = videos.filter(v => isWithinDays(v.publishedAt, period))

  const history = JSON.parse(localStorage.getItem('yt_history') || '[]')
  const chartLabels = history.slice(-Math.min(period, history.length)).map(h => formatDateShort(h.date))
  const chartValues = history.slice(-Math.min(period, history.length)).map(h => h.subscribers)

  const topByViews = [...filtered].sort((a, b) => b.views - a.views).slice(0, 8)

  const heatmapPosts = filtered.map(v => ({
    timestamp: v.publishedAt,
    engagement: v.views,
  }))
  const heatmatrix = calcBestUploadTime(heatmapPosts)

  if (loading) {
    return <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="YOUTUBE" ko="유튜브 분석" />

      <div className="grid grid-cols-2 gap-px bg-white/10 mx-5 mt-5 mb-5">
        <StatCard label="구독자" value={stats?.subscribers} />
        <StatCard label="총 조회수" value={stats?.totalViews} />
        <StatCard label="영상 수" value={stats?.videoCount} />
        <StatCard label="기간 내 영상" value={filtered.length} />
      </div>

      <div className="px-5 mb-4">
        <FilterChip options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      {chartValues.length > 1 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">SUBSCRIBER TREND</div>
          <LineChart labels={chartLabels} values={chartValues} color="#FFEE00" />
        </div>
      )}

      {topByViews.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">TOP VIDEOS BY VIEWS</div>
          <BarChart
            labels={topByViews.map(v => v.title.slice(0, 20))}
            values={topByViews.map(v => v.views)}
            color="#FFEE00"
            horizontal={true}
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
        <div className="heading-en text-xs text-white/40 mb-2">VIDEOS ({filtered.length})</div>
        {filtered.map(v => (
          <PostCard
            key={v.videoId}
            thumbnail={v.thumbnail}
            title={v.title}
            timestamp={v.publishedAt}
            metrics={[
              { label: 'VIEWS', value: v.views },
              { label: 'LIKES', value: v.likes },
              { label: 'COMMENTS', value: v.comments },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
