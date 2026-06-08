import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { fetchChannelStats, fetchRecentVideos } from '../services/youtube'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'
import { readCache, writeCache } from '../hooks/useCache'
import { formatDate } from '../utils/formatDate'
import { formatNumber } from '../utils/formatNumber'

export default function Dashboard() {
  const navigate = useNavigate()
  const [yt, setYt]       = useState(null)
  const [ig, setIg]       = useState(null)
  const [ytTop, setYtTop] = useState(null)
  const [igTop, setIgTop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const hasYtKey    = !!localStorage.getItem('yt_api_key')
  const hasIgToken  = !!localStorage.getItem('ig_access_token')
  const channelId   = localStorage.getItem('yt_channel_id')

  useEffect(() => {
    async function load() {
      setLoading(true)

      try {
        if (hasYtKey && channelId) {
          let ytData = readCache('yt_stats')
          if (!ytData) { ytData = await fetchChannelStats(channelId); writeCache('yt_stats', ytData) }
          setYt(ytData)

          let videos = readCache('yt_videos')
          if (!videos) { videos = await fetchRecentVideos(channelId, 10); writeCache('yt_videos', videos) }
          setYtTop([...videos].sort((a, b) => b.views - a.views)[0] || null)
        }
      } catch (e) {
        if (e.message !== 'NO_API_KEY') {
          setToast({ message: 'YouTube 로드 실패 — 캐시 사용 중', type: 'error' })
        }
      }

      try {
        if (hasIgToken) {
          let igData = readCache('ig_profile')
          if (!igData) { igData = await fetchIGProfile(); writeCache('ig_profile', igData) }
          setIg(igData)

          let media = readCache('ig_media')
          if (!media) { media = await fetchIGMedia(10); writeCache('ig_media', media) }
          setIgTop([...media].sort((a, b) => (b.like_count || 0) - (a.like_count || 0))[0] || null)
        }
      } catch (e) {
        if (e.message === 'TOKEN_EXPIRED') {
          setToast({ message: 'Instagram 토큰 만료 — 설정에서 갱신하세요', type: 'error' })
        } else if (e.message !== 'NO_ACCESS_TOKEN') {
          setToast({ message: 'Instagram 로드 실패', type: 'error' })
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  if (!hasYtKey && !hasIgToken) {
    return (
      <div className="flex flex-col items-start justify-center min-h-screen px-5">
        <div className="heading-en text-5xl text-yellow leading-none mb-4">API<br/>연동<br/>필요</div>
        <p style={{ fontFamily: 'Pretendard', letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          분석을 시작하려면 YouTube API 키와 Instagram 토큰을 설정하세요.
        </p>
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: '#FFEE00', color: '#0A0A0A',
            fontFamily: 'Barlow Condensed', fontWeight: 800,
            fontSize: 20, textTransform: 'uppercase',
            letterSpacing: '0.05em', border: 'none',
            padding: '14px 24px', cursor: 'pointer',
          }}
        >
          설정 시작 →
        </button>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="DASHBOARD" ko="전체 요약" />

      {loading ? (
        <div className="heading-en text-white/30 text-xl px-5 pt-8">LOADING...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px bg-white/10 m-5">
            <StatCard label="팔로워" value={ig?.followers_count} />
            <StatCard label="구독자" value={yt?.subscribers} />
            <StatCard label="총 조회수" value={yt?.totalViews} />
            <StatCard label="게시물" value={ig?.media_count} />
          </div>

          {ytTop && (
            <div className="px-5 mb-5">
              <div className="heading-en text-xs text-white/40 mb-2">TOP VIDEO THIS PERIOD</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A' }}>
                {ytTop.thumbnail && (
                  <img src={ytTop.thumbnail} alt="" className="w-full object-cover" style={{ maxHeight: 160 }} />
                )}
                <div className="p-3">
                  <p style={{ fontFamily: 'Pretendard', fontSize: 13, letterSpacing: '-0.05em', color: '#F5F5F0', marginBottom: 8 }}>
                    {ytTop.title}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>VIEWS</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#FFEE00' }}>{formatNumber(ytTop.views)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>LIKES</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#F5F5F0' }}>{formatNumber(ytTop.likes)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {igTop && (
            <div className="px-5 mb-5">
              <div className="heading-en text-xs text-white/40 mb-2">TOP POST THIS PERIOD</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1A1A1A', display: 'flex', gap: 12, padding: 12 }}>
                {(igTop.thumbnail_url || igTop.media_url) && (
                  <img src={igTop.thumbnail_url || igTop.media_url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontFamily: 'Pretendard', fontSize: 12, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                    {formatDate(igTop.timestamp)}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>LIKES</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#FFEE00' }}>{formatNumber(igTop.like_count)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>COMMENTS</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#F5F5F0' }}>{formatNumber(igTop.comments_count)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => navigate('/instagram')}
              style={{ background: '#0033FF', color: '#F5F5F0', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', border: 'none', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              INSTAGRAM →
            </button>
            <button
              onClick={() => navigate('/youtube')}
              style={{ background: '#FFEE00', color: '#0A0A0A', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', border: 'none', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              YOUTUBE →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
