export default function FilterChip({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`heading-en px-4 py-2 text-sm border transition-colors ${
            value === opt.value
              ? 'bg-yellow text-black border-yellow'
              : 'bg-transparent text-white border-white/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
