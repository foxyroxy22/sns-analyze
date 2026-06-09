import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',          label: '대시보드', icon: '◼' },
  { path: '/instagram', label: 'INSTA',   icon: '◻' },
  { path: '/youtube',   label: 'YT',      icon: '▷' },
  { path: '/analyze',   label: '분석',    icon: '◈' },
  { path: '/report',    label: '리포트',  icon: '≡' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid #FFEE00',
        maxWidth: 390,
        margin: '0 auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center py-3 heading-en text-[10px] transition-colors"
            style={{
              background: active ? '#FFEE00' : 'transparent',
              color: active ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
              border: 'none',
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
