import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 left-0 right-0 mx-auto z-50 px-5 py-3 heading-en text-base flex justify-between items-center ${
        type === 'error'
          ? 'border border-red-500 text-red-400 bg-black'
          : 'bg-yellow text-black'
      }`}
      style={{ width: 'calc(100% - 40px)', maxWidth: 350 }}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-60 text-lg leading-none">✕</button>
    </div>
  )
}
