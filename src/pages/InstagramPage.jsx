import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import HeatmapGrid from '../components/HeatmapGrid'
import FilterChip from '../components/FilterChip'
import Toast from '../components/Toast'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'
import { analyzePost } from '../services/gemini'
import { readCache, writeCache } from '../hooks/useCache'
import { calcBestUploadTime } from '../utils/calcBestUploadTime'
import { formatDateShort, isWithinDays } from '../utils/formatDate'
import { formatNumber } from '../utils/formatNumber'

const PERIOD_OPTIONS = [
  { label: '7일',  value: 7  },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

const TYPE_COLOR = {
  IMAGE:       '#FFEE00',
  VIDEO:       '#0033FF',
  CAROUSEL_ALBUM: '#F5F5F0',
}

// ─── 포스트 모달 ─────────────────────────────────────────────────────────────
function PostModal({ post, onClose }) {
  const [aiResult,   setAiResult]   = useState(null)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiProgress, setAiProgress] = useState('')
  const [toast,      setToast]      = useState(null)

  const hasGemini = !!localStorage.getItem('gemini_api_key')

  async function runAnalysis() {
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await analyzePost({
        post,
        comments: [],
        onProgress: setAiProgress,
      })
      setAiResult(result)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
    setAiLoading(false)
    setAiProgress('')
  }

  const date       = post.timestamp ? new Date(post.timestamp).toLocaleDateString('ko-KR') : ''
  const typeColor  = TYPE_COLOR[post.media_type] || '#F5F5F0'
  const engagement = (post.like_count || 0) + (post.comments_count || 0)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'flex-end',
        maxWidth: 390, margin: '0 auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{
        width: '100%',
        background: '#0A0A0A',
        borderTop: '2px solid #FFEE00',
        maxHeight: '90vh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: typeColor, marginRight: 8 }}>{post.media_type || 'POST'}</span>
            <span style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.05em' }}>{date}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '16px' }}>
          {/* 썸네일 */}
          {(post.thumbnail_url || post.media_url) && (
            <img
              src={post.thumbnail_url || post.media_url}
              alt=""
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', marginBottom: 14, display: 'block' }}
            />
          )}

          {/* 수치 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }}>
            {[
              { label: 'LIKES',      val: post.like_count     },
              { label: 'COMMENTS',   val: post.comments_count },
              { label: 'ENGAGEMENT', val: engagement          },
            ].map(m => (
              <div key={m.label} style={{ background: '#0D0D0D', padding: '12px 10px' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, color: '#FFEE00', lineHeight: 1 }}>{formatNumber(m.val)}</div>
              </div>
            ))}
          </div>

          {/* 캡션 */}
          {post.caption && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>CAPTION</div>
              <p style={{ fontFamily: 'Pretendard', fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.05em', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {post.caption}
              </p>
            </div>
          )}

          {/* AI 분석 버튼 */}
          {!aiResult && (
            <button
              onClick={runAnalysis}
              disabled={aiLoading || !hasGemini}
              style={{
                width: '100%',
                background: aiLoading || !hasGemini ? '#1A1A1A' : '#FFEE00',
                color: aiLoading || !hasGemini ? 'rgba(255,255,255,0.2)' : '#0A0A0A',
                fontFamily: 'Barlow Condensed',
                fontWeight: 800,
                fontSize: 17,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                border: 'none',
                padding: '16px',
                cursor: aiLoading || !hasGemini ? 'not-allowed' : 'pointer',
                marginBottom: !hasGemini ? 4 : 0,
              }}
            >
              {aiLoading ? (aiProgress || '분석 중...') : '◈  AI 성과 및 댓글 반응 분석'}
            </button>
          )}

          {!hasGemini && (
            <p style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.05em', textAlign: 'center', marginTop: 4 }}>
              설정(⚙)에서 Gemini API 키를 먼저 입력해주세요
            </p>
          )}

          {/* AI 분석 결과 */}
          {aiResult && <PostAiResult result={aiResult} onRerun={runAnalysis} loading={aiLoading} />}
        </div>
      </div>
    </div>
  )
}

// ─── AI 분석 결과 ─────────────────────────────────────────────────────────────
function PostAiResult({ result, onRerun, loading }) {
  if (result.raw) {
    return (
      <div style={{ marginTop: 4 }}>
        <RCard label="ANALYSIS">
          <p style={bodyTxt}>{result.raw}</p>
        </RCard>
        <RerunBtn onClick={onRerun} loading={loading} />
      </div>
    )
  }

  const scoreColor = result.performanceScore >= 75 ? '#FFEE00' : result.performanceScore >= 50 ? '#F5F5F0' : '#FF5555'

  return (
    <div style={{ marginTop: 4 }}>
      {/* 판정 + 점수 */}
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111', padding: '14px 16px', marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>VERDICT</div>
          <div style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.5 }}>{result.verdict}</div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 38, fontWeight: 700, color: scoreColor, lineHeight: 1, flexShrink: 0 }}>
          {result.performanceScore}
        </div>
      </div>
      <div style={{ height: 3, background: '#1A1A1A', marginBottom: 2 }}>
        <div style={{ height: '100%', width: `${result.performanceScore}%`, background: scoreColor }} />
      </div>

      {result.whyItWorked && (
        <RCard label="WHY IT WORKED"><p style={bodyTxt}>{result.whyItWorked}</p></RCard>
      )}
      {result.brandFit && result.brandFit !== '(프로필 미설정)' && (
        <RCard label="BRAND FIT"><p style={bodyTxt}>{result.brandFit}</p></RCard>
      )}
      {result.audienceInsight && (
        <RCard label="AUDIENCE INSIGHT"><p style={bodyTxt}>{result.audienceInsight}</p></RCard>
      )}
      {result.doNextTime?.length > 0 && (
        <RCard label="NEXT ACTION">
          {result.doNextTime.map((s, i) => <Bullet key={i} color="#FFEE00" text={s} />)}
        </RCard>
      )}

      <RerunBtn onClick={onRerun} loading={loading} />
    </div>
  )
}

function RerunBtn({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', marginTop: 10,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Barlow Condensed',
        fontSize: 12, textTransform: 'uppercase',
        letterSpacing: '0.1em', padding: '10px',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '분석 중...' : '↺ 다시 분석'}
    </button>
  )
}

// ─── 유틸 컴포넌트 ────────────────────────────────────────────────────────────
const bodyTxt = { fontFamily: 'Pretendard', fontSize: 13, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.05em', lineHeight: 1.7, margin: 0 }

function RCard({ label, children }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0D0D0D', padding: '12px 14px 14px', marginBottom: 2 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

function Bullet({ color, text }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color, flexShrink: 0, paddingTop: 1 }}>▸</span>
      <span style={{ fontFamily: 'Pretendard', fontSize: 13, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function InstagramPage() {
  const [profile,    setProfile]    = useState(null)
  const [media,      setMedia]      = useState([])
  const [period,     setPeriod]     = useState(30)
  const [sortMode,   setSortMode]   = useState('recent')   // 'recent' | 'popular'
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)
  const [modalPost,  setModalPost]  = useState(null)

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
          message: e.message === 'TOKEN_EXPIRED'   ? 'Instagram 토큰 만료'
                 : e.message === 'NO_ACCESS_TOKEN' ? '설정에서 Instagram 토큰을 입력해주세요'
                 : e.message === 'NO_ACCOUNT_ID'   ? '설정에서 계정 ID를 입력해주세요'
                 : 'Instagram 로드 실패',
          type: 'error',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  // 오늘 팔로워 스냅샷 저장
  useEffect(() => {
    if (!profile) return
    const today    = new Date().toISOString().split('T')[0]
    const existing = JSON.parse(localStorage.getItem('ig_history') || '[]')
    if (!existing.find(h => h.date === today)) {
      existing.push({ date: today, followers: profile.followers_count })
      if (existing.length > 365) existing.shift()
      localStorage.setItem('ig_history', JSON.stringify(existing))
    }
  }, [profile])

  const filtered = media.filter(p => isWithinDays(p.timestamp, period))

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'popular') {
      const engA = (a.like_count || 0) + (a.comments_count || 0)
      const engB = (b.like_count || 0) + (b.comments_count || 0)
      return engB - engA
    }
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  // 팔로워 히스토리 차트
  const history      = JSON.parse(localStorage.getItem('ig_history') || '[]')
  const slicedHist   = history.slice(-Math.min(period, history.length))
  const chartLabels  = slicedHist.map(h => formatDateShort(h.date))
  const chartValues  = slicedHist.map(h => h.followers)

  // 인게이지먼트 차트 (최근 10개)
  const engData = filtered.slice(0, 10).map(p => ({
    label: formatDateShort(p.timestamp),
    value: (p.like_count || 0) + (p.comments_count || 0),
  }))

  // 히트맵
  const heatPosts = filtered.map(p => ({
    timestamp:  p.timestamp,
    engagement: (p.like_count || 0) + (p.comments_count || 0),
  }))
  const heatmatrix = calcBestUploadTime(heatPosts)

  if (loading) {
    return <div className="heading-en text-white/30 text-xl px-5 pt-12">LOADING...</div>
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {modalPost && <PostModal post={modalPost} onClose={() => setModalPost(null)} />}

      <PageHeader en="INSTAGRAM" ko="인스타그램 분석" />

      {/* 스탯 카드 */}
      <div className="grid grid-cols-2 gap-px bg-white/10 mx-5 mt-5 mb-5">
        <StatCard label="팔로워"   value={profile?.followers_count} />
        <StatCard label="게시물 수" value={profile?.media_count} />
      </div>

      {/* 기간 필터 */}
      <div className="px-5 mb-4">
        <FilterChip options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      {/* 팔로워 추이 */}
      {chartValues.length > 1 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">FOLLOWER TREND</div>
          <LineChart labels={chartLabels} values={chartValues} color="#0033FF" />
        </div>
      )}

      {/* 인게이지먼트 차트 */}
      {engData.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">ENGAGEMENT PER POST</div>
          <BarChart labels={engData.map(d => d.label)} values={engData.map(d => d.value)} color="#FFEE00" />
        </div>
      )}

      {/* 히트맵 */}
      {heatPosts.length > 0 && (
        <div className="px-5 mb-5">
          <div className="heading-en text-xs text-white/40 mb-2">BEST UPLOAD TIME</div>
          <HeatmapGrid matrix={heatmatrix} />
        </div>
      )}

      {/* 피드 목록 */}
      <div className="px-5 mb-8">
        {/* 정렬 토글 */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
          {[
            { key: 'recent',  label: 'RECENT'  },
            { key: 'popular', label: 'POPULAR' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              style={{
                flex: 1,
                fontFamily: 'Barlow Condensed',
                fontWeight: 800,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                background: sortMode === opt.key ? '#FFEE00' : 'transparent',
                color: sortMode === opt.key ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '9px 8px',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {opt.key === 'popular' ? '🔥 ' : ''}{opt.label}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
          POSTS ({sorted.length})
        </div>

        {sorted.map(post => {
          const eng       = (post.like_count || 0) + (post.comments_count || 0)
          const typeColor = TYPE_COLOR[post.media_type] || '#F5F5F0'
          const date      = post.timestamp ? new Date(post.timestamp).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : ''

          return (
            <button
              key={post.id}
              onClick={() => setModalPost(post)}
              style={{
                width: '100%',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '12px 0',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* 썸네일 */}
              <div style={{ width: 56, height: 56, flexShrink: 0, background: '#1A1A1A', overflow: 'hidden', position: 'relative' }}>
                {(post.thumbnail_url || post.media_url) ? (
                  <img src={post.thumbnail_url || post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>▣</div>
                )}
                {/* 타입 배지 */}
                <div style={{ position: 'absolute', top: 3, left: 3, background: typeColor, width: 6, height: 6, borderRadius: '50%' }} />
              </div>

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {post.caption && (
                  <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.05em', lineHeight: 1.4, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.caption}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: typeColor }}>{post.media_type || 'POST'}</span>
                  <span style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.03em' }}>{date}</span>
                </div>
              </div>

              {/* 수치 */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, color: '#FFEE00', lineHeight: 1 }}>{formatNumber(post.like_count)}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>likes</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{formatNumber(eng)} eng</div>
              </div>
            </button>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ fontFamily: 'Pretendard', fontSize: 14, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.05em', paddingTop: 24, textAlign: 'center' }}>
            게시물이 없어요
          </div>
        )}
      </div>
    </div>
  )
}
