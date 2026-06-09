import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

export default function Settings() {
  const navigate = useNavigate()
  const [ytKey, setYtKey]         = useState(localStorage.getItem('yt_api_key') || '')
  const [igToken, setIgToken]     = useState(localStorage.getItem('ig_access_token') || '')
  const [igAccountId, setIgAccountId] = useState(localStorage.getItem('ig_account_id') || '')
  const [ytChannelId, setYtChannelId] = useState(localStorage.getItem('yt_channel_id') || '')
  const [toast, setToast]         = useState(null)

  function save() {
    localStorage.setItem('yt_api_key', ytKey.trim())
    localStorage.setItem('ig_access_token', igToken.trim())
    localStorage.setItem('ig_account_id', igAccountId.trim())
    localStorage.setItem('yt_channel_id', ytChannelId.trim())
    setToast({ message: '저장 완료!', type: 'success' })
    setTimeout(() => navigate('/'), 1500)
  }

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#F5F5F0',
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    padding: '12px 14px',
    outline: 'none',
    letterSpacing: '0.02em',
    display: 'block',
    marginBottom: 8,
  }

  const labelStyle = {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.5)',
    display: 'block',
    marginBottom: 6,
    marginTop: 20,
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="SETTINGS" ko="API 연동 설정" />

      <div className="px-5 pt-4">
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 8 }}>
          <div className="heading-en text-xl text-yellow mb-3">YOUTUBE</div>
          <label style={labelStyle}>YouTube Data API v3 Key</label>
          <input
            style={inputStyle}
            value={ytKey}
            onChange={e => setYtKey(e.target.value)}
            placeholder="AIza..."
            spellCheck={false}
          />
          <label style={labelStyle}>내 채널 ID</label>
          <input
            style={inputStyle}
            value={ytChannelId}
            onChange={e => setYtChannelId(e.target.value)}
            placeholder="UCxxxxx..."
            spellCheck={false}
          />
          <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em', lineHeight: 1.6 }}>
            Google Cloud Console → YouTube Data API v3 → 사용 설정 → API 키 생성
          </p>
        </div>

        <div style={{ paddingBottom: 24 }}>
          <div className="heading-en text-xl mb-3" style={{ color: '#0033FF' }}>INSTAGRAM</div>
          <label style={labelStyle}>Instagram Business Account ID</label>
          <input
            style={inputStyle}
            value={igAccountId}
            onChange={e => setIgAccountId(e.target.value)}
            placeholder="17자리 숫자 ID 입력"
            spellCheck={false}
          />
          <label style={labelStyle}>User Access Token</label>
          <input
            style={inputStyle}
            value={igToken}
            onChange={e => setIgToken(e.target.value)}
            placeholder="EAAv..."
            spellCheck={false}
          />
          <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em', lineHeight: 1.6 }}>
            Meta Developer Console → Graph API Explorer → instagram_business_account ID + EAAv... 토큰 필요
          </p>
        </div>

        <button
          onClick={save}
          style={{
            width: '100%',
            background: '#FFEE00',
            color: '#0A0A0A',
            fontFamily: 'Barlow Condensed',
            fontWeight: 800,
            fontSize: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            padding: '16px 20px',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          저장 →
        </button>
      </div>
    </div>
  )
}
