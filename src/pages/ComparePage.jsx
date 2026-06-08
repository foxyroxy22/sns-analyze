import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import BarChart from '../components/BarChart'
import { fetchChannelStats, searchChannel } from '../services/youtube'
import { formatNumber } from '../utils/formatNumber'
import { readCache, writeCache } from '../hooks/useCache'

export default function ComparePage() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [competitor, setComp]     = useState(null)
  const [myStats, setMyStats]     = useState(null)
  const [searching, setSearching] = useState(false)
  const [toast, setToast]         = useState(null)

  const channelId = localStorage.getItem('yt_channel_id')

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchChannel(query)
      setResults(res)
    } catch (e) {
      setToast({ message: '검색 실패 — API 키를 확인하세요', type: 'error' })
    }
    setSearching(false)
  }

  async function selectCompetitor(ch) {
    setResults([])
    try {
      const recents = JSON.parse(localStorage.getItem('compare_recents') || '[]')
      if (!recents.find(r => r.channelId === ch.channelId)) {
        recents.unshift(ch)
        if (recents.length > 5) recents.pop()
        localStorage.setItem('compare_recents', JSON.stringify(recents))
      }

      const compStats = await fetchChannelStats(ch.channelId)
      let mine = readCache('yt_stats')
      if (!mine && channelId) {
        mine = await fetchChannelStats(channelId)
        writeCache('yt_stats', mine)
      }
      setComp(compStats)
      setMyStats(mine)
    } catch (e) {
      setToast({ message: '채널 정보 로드 실패', type: 'error' })
    }
  }

  const recents = JSON.parse(localStorage.getItem('compare_recents') || '[]')

  const compareRows = [
    { label: '구독자',  myVal: myStats?.subscribers,  compVal: competitor?.subscribers },
    { label: '총 조회수', myVal: myStats?.totalViews, compVal: competitor?.totalViews },
    { label: '영상 수',  myVal: myStats?.videoCount,  compVal: competitor?.videoCount },
  ]

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="COMPARE" ko="채널 비교" />

      <div className="px-5 pt-5">
        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="채널명 검색..."
            style={{
              flex: 1, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#F5F5F0', fontFamily: 'Pretendard',
              fontSize: 15, padding: '12px 14px', outline: 'none',
              letterSpacing: '-0.05em',
            }}
          />
          <button
            onClick={search}
            style={{
              background: '#FFEE00', color: '#0A0A0A',
              fontFamily: 'Barlow Condensed', fontWeight: 800,
              fontSize: 16, textTransform: 'uppercase',
              border: 'none', padding: '12px 16px', cursor: 'pointer',
            }}
          >
            {searching ? '...' : '검색'}
          </button>
        </div>

        {results.map(ch => (
          <button
            key={ch.channelId}
            onClick={() => selectCompetitor(ch)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
              padding: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left',
            }}
          >
            {ch.thumbnail && (
              <img src={ch.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span style={{ fontFamily: 'Pretendard', color: '#F5F5F0', fontSize: 14, letterSpacing: '-0.05em' }}>
              {ch.title}
            </span>
          </button>
        ))}

        {!results.length && recents.length > 0 && (
          <div className="mb-5">
            <div className="heading-en text-xs text-white/30 mb-2">RECENT SEARCHES</div>
            {recents.map(ch => (
              <button
                key={ch.channelId}
                onClick={() => selectCompetitor(ch)}
                style={{
                  display: 'block', width: '100%',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'Pretendard',
                  fontSize: 13, letterSpacing: '-0.05em',
                  padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left', marginBottom: 4,
                }}
              >
                {ch.title}
              </button>
            ))}
          </div>
        )}

        {competitor && (
          <div className="mt-6">
            <div className="heading-en text-xs text-white/40 mb-3">COMPARISON</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
              {compareRows.map(row => (
                <>
                  <div key={`my-${row.label}`} style={{ background: '#1A1A1A', padding: 16 }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
                      나 / {row.label}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#FFEE00' }}>
                      {formatNumber(row.myVal)}
                    </div>
                  </div>
                  <div key={`comp-${row.label}`} style={{ background: '#1A1A1A', padding: 16 }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {competitor.title.slice(0, 10)} / {row.label}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#F5F5F0' }}>
                      {formatNumber(row.compVal)}
                    </div>
                  </div>
                </>
              ))}
            </div>

            {myStats && (
              <div className="mb-5">
                <div className="heading-en text-xs text-white/40 mb-2">SUBSCRIBERS COMPARISON</div>
                <BarChart
                  labels={['나', competitor.title.slice(0, 12)]}
                  values={[myStats.subscribers, competitor.subscribers]}
                  color="#FFEE00"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
