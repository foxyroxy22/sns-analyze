import { formatNumber } from '../utils/formatNumber'
import { formatDate } from '../utils/formatDate'

export default function PostCard({ thumbnail, title, timestamp, metrics = [] }) {
  return (
    <div className="flex gap-3 border-b border-white/10 py-4">
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="w-16 h-16 object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm text-white/80 truncate mb-2" style={{ letterSpacing: '-0.05em' }}>
            {title}
          </p>
        )}
        <div className="text-xs text-white/30 mb-2">{formatDate(timestamp)}</div>
        <div className="flex gap-4 flex-wrap">
          {metrics.map(m => (
            <div key={m.label}>
              <div
                className="text-xs text-white/30 uppercase"
                style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.05em' }}
              >
                {m.label}
              </div>
              <div className="stat-num text-base text-white">
                {formatNumber(m.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
