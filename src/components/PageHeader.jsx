export default function PageHeader({ en, ko }) {
  return (
    <div className="px-5 pt-6 pb-5 border-b border-white/10">
      {en && (
        <div className="heading-en text-5xl leading-none text-yellow mb-1">
          {en}
        </div>
      )}
      {ko && (
        <div className="text-base text-white/50" style={{ letterSpacing: '-0.05em' }}>
          {ko}
        </div>
      )}
    </div>
  )
}
