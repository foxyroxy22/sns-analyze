import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { formatNumber } from '../utils/formatNumber'
import { formatDate } from '../utils/formatDate'

function buildReport(period) {
  const ytHistory = JSON.parse(localStorage.getItem('yt_history') || '[]')
  const igHistory = JSON.parse(localStorage.getItem('ig_history') || '[]')

  const lookback = period === 'weekly' ? 8 : 32

  const ytLatest  = ytHistory[ytHistory.length - 1] || null
  const ytPrev    = ytHistory[ytHistory.length - lookback] || null
  const igLatest  = igHistory[igHistory.length - 1] || null
  const igPrev    = igHistory[igHistory.length - lookback] || null

  return {
    ytLatest,
    igLatest,
    ytDelta: ytLatest && ytPrev ? ytLatest.subscribers - ytPrev.subscribers : null,
    igDelta: igLatest && igPrev ? igLatest.followers   - igPrev.followers   : null,
    ytHistory,
    igHistory,
  }
}

function DeltaValue({ value }) {
  if (value == null) return <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: 'rgba(255,255,255,0.2)' }}>—</span>
  const positive = value >= 0
  return (
    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: positive ? '#44ff88' : '#ff4444' }}>
      {positive ? '+' : ''}{value}
    </span>
  )
}

export default function ReportPage() {
  const [period, setPeriod] = useState('weekly')
  const [toast, setToast]   = useState(null)

  const report = buildReport(period)

  function exportReport() {
    const lines = [
      `SNS ANALYZE REPORT — ${new Date().toLocaleDateString('ko-KR')}`,
      `기간: ${period === 'weekly' ? '주간' : '월간'}`,
      '',
      '[ YOUTUBE ]',
      `구독자: ${formatNumber(report.ytLatest?.subscribers)}`,
      `증감: ${report.ytDelta != null ? (report.ytDelta >= 0 ? '+' : '') + report.ytDelta : 'N/A'}`,
      '',
      '[ INSTAGRAM ]',
      `팔로워: ${formatNumber(report.igLatest?.followers)}`,
      `증감: ${report.igDelta != null ? (report.igDelta >= 0 ? '+' : '') + report.igDelta : 'N/A'}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => setToast({ message: '클립보드에 복사됐어요!', type: 'success' }))
      .catch(() => setToast({ message: '복사 실패', type: 'error' }))
  }

  const statBox = (label, value, accent = false) => (
    <div style={{ background: '#1A1A1A', border: `1px solid ${accent ? 'rgba(255,238,0,0.3)' : 'rgba(255,255,255,0.1)'}`, padding: 16 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
        {label}
      </div>
      {value}
    </div>
  )

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="REPORT" ko="주간 · 월간 리포트" />

      <div className="px-5 pt-5">
        {/* Period toggle */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'weekly',  label: '주간' },
            { key: 'monthly', label: '월간' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 16,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                background: period === p.key ? '#FFEE00' : 'transparent',
                color: period === p.key ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                borderBottom: period === p.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* YouTube */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
          <div className="heading-en text-xl text-yellow mb-4">YOUTUBE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {statBox('구독자',
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: '#FFEE00' }}>{formatNumber(report.ytLatest?.subscribers)}</div>
            )}
            {statBox(`${period === 'weekly' ? '주간' : '월간'} 증감`,
              <DeltaValue value={report.ytDelta} />
            )}
          </div>
        </div>

        {/* Instagram */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
          <div className="heading-en text-xl mb-4" style={{ color: '#0033FF' }}>INSTAGRAM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {statBox('팔로워',
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, color: '#FFEE00' }}>{formatNumber(report.igLatest?.followers)}</div>
            )}
            {statBox(`${period === 'weekly' ? '주간' : '월간'} 증감`,
              <DeltaValue value={report.igDelta} />
            )}
          </div>
        </div>

        {/* History snapshots */}
        {report.ytHistory.length > 0 && (
          <div className="mb-6">
            <div className="heading-en text-xs text-white/40 mb-3">YT HISTORY SNAPSHOTS</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {[...report.ytHistory].reverse().slice(0, 30).map((h, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatDate(h.date)}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#FFEE00' }}>{formatNumber(h.subscribers)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.igHistory.length > 0 && (
          <div className="mb-6">
            <div className="heading-en text-xs text-white/40 mb-3">IG HISTORY SNAPSHOTS</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {[...report.igHistory].reverse().slice(0, 30).map((h, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatDate(h.date)}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#0033FF' }}>{formatNumber(h.followers)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <button
          onClick={exportReport}
          style={{
            width: '100%', background: 'transparent', color: '#F5F5F0',
            fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '14px 20px', cursor: 'pointer', marginBottom: 24,
          }}
        >
          클립보드에 복사 →
        </button>
      </div>
    </div>
  )
}
