import { formatNumber, formatDelta } from '../utils/formatNumber'

export default function StatCard({ label, value, delta, accent = false, className = '' }) {
  return (
    <div
      className={`p-5 border ${accent ? 'border-yellow' : 'border-white/10'} ${className}`}
      style={{ background: '#1A1A1A' }}
    >
      <div
        className="text-xs text-white/40 uppercase mb-1"
        style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}
      >
        {label}
      </div>
      <div className="stat-num text-4xl leading-none text-yellow">
        {formatNumber(value)}
      </div>
      {delta != null && (
        <div className={`heading-en text-sm mt-1 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatDelta(delta)}
        </div>
      )}
    </div>
  )
}
