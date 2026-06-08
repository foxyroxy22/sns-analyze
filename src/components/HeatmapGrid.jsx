import { DAY_LABELS } from '../utils/calcBestUploadTime'

// matrix: 7×24 (day × hour), values are avg engagement or null
export default function HeatmapGrid({ matrix }) {
  const allVals = matrix.flat().filter(v => v != null)
  const max = allVals.length ? Math.max(...allVals) : 1

  const alpha = (val) => val == null ? 0 : Math.round((val / max) * 200)

  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21]

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', padding: 12, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(24, 1fr)', gap: 2, minWidth: 340 }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 8, color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', paddingBottom: 4,
          }}>
            {displayHours.includes(h) ? h : ''}
          </div>
        ))}
        {matrix.map((row, d) => (
          <div key={d} style={{ display: 'contents' }}>
            <div style={{
              fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
              textTransform: 'uppercase',
            }}>
              {DAY_LABELS[d]}
            </div>
            {row.map((val, h) => (
              <div key={h} style={{
                height: 16,
                background: `rgba(255, 238, 0, ${alpha(val) / 255})`,
                border: '1px solid rgba(255,255,255,0.05)',
              }} title={val != null ? `${DAY_LABELS[d]} ${h}시: ${val.toFixed(0)}` : ''} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: '-0.05em' }}>
        밝을수록 참여율이 높은 시간대
      </div>
    </div>
  )
}
