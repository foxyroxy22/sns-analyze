import { useNavigate } from 'react-router-dom'

export default function SettingsButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/settings')}
      style={{
        position: 'fixed',
        top: 16,
        right: 20,
        zIndex: 50,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Barlow Condensed',
        fontSize: 18,
        padding: '4px 10px',
        cursor: 'pointer',
      }}
    >
      ⚙
    </button>
  )
}
