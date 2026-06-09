import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

function getProfile() {
  try { return JSON.parse(localStorage.getItem('account_profile') || '{}') } catch { return {} }
}

export default function Settings() {
  const navigate = useNavigate()
  const savedProfile = getProfile()

  const [ytKey,       setYtKey]       = useState(localStorage.getItem('yt_api_key') || '')
  const [igToken,     setIgToken]     = useState(localStorage.getItem('ig_access_token') || '')
  const [igAccountId, setIgAccountId] = useState(localStorage.getItem('ig_account_id') || '')
  const [ytChannelId, setYtChannelId] = useState(localStorage.getItem('yt_channel_id') || '')
  const [geminiKey,   setGeminiKey]   = useState(localStorage.getItem('gemini_api_key') || '')
  const [concept,     setConcept]     = useState(savedProfile.concept || '')
  const [target,      setTarget]      = useState(savedProfile.target || '')
  const [visual,      setVisual]      = useState(savedProfile.visual || '')
  const [toast,       setToast]       = useState(null)

  function save() {
    localStorage.setItem('yt_api_key',       ytKey.trim())
    localStorage.setItem('ig_access_token',  igToken.trim())
    localStorage.setItem('ig_account_id',    igAccountId.trim())
    localStorage.setItem('yt_channel_id',    ytChannelId.trim())
    localStorage.setItem('gemini_api_key',   geminiKey.trim())
    localStorage.setItem('account_profile',  JSON.stringify({
      concept: concept.trim(),
      target:  target.trim(),
      visual:  visual.trim(),
    }))
    setToast({ message: '저장 완료!', type: 'success' })
    setTimeout(() => navigate('/'), 1500)
  }

  const inp = {
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

  const ta = {
    ...inp,
    fontFamily: 'Pretendard',
    fontSize: 14,
    letterSpacing: '-0.05em',
    lineHeight: 1.65,
    resize: 'none',
    minHeight: 80,
  }

  const lbl = {
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

  const hint = {
    fontFamily: 'Pretendard',
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '-0.05em',
    lineHeight: 1.6,
    marginTop: 4,
  }

  const divider = { borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 24, paddingBottom: 24 }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="SETTINGS" ko="설정" />

      <div className="px-5 pt-4" style={{ paddingBottom: 100 }}>

        {/* ── 내 계정 프로필 ──────────────────────────────── */}
        <div style={{ ...divider, borderTop: 'none', marginTop: 0 }}>
          <div className="heading-en text-xl mb-1" style={{ color: '#FFEE00' }}>MY ACCOUNT PROFILE</div>
          <p style={{ ...hint, marginBottom: 16 }}>
            Gemini가 분석의 기준으로 삼는 정보예요. 구체적일수록 정확한 피드백을 받아요.
          </p>

          <label style={lbl}>계정 컨셉 · 정체성</label>
          <textarea
            style={ta}
            value={concept}
            onChange={e => setConcept(e.target.value)}
            placeholder="예: 키치하고 발랄한 일상 브이로거. 20대 여성의 감성 일상과 뷰티를 메인으로 다루는 계정."
          />

          <label style={lbl}>핵심 타겟 오디언스</label>
          <textarea
            style={{ ...ta, minHeight: 60 }}
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="예: 20-28세 여성, 뷰티·패션 관심, 유머 코드 있는 콘텐츠 선호"
          />

          <label style={lbl}>추구하는 비주얼 스타일</label>
          <textarea
            style={{ ...ta, minHeight: 60 }}
            value={visual}
            onChange={e => setVisual(e.target.value)}
            placeholder="예: 비비드한 컬러감, 3D 오브젝트 활용, Y2K 무드, 텍스처 강조"
          />
        </div>

        {/* ── YouTube ─────────────────────────────────────── */}
        <div style={divider}>
          <div className="heading-en text-xl text-yellow mb-3">YOUTUBE</div>
          <label style={lbl}>YouTube Data API v3 Key</label>
          <input style={inp} value={ytKey} onChange={e => setYtKey(e.target.value)} placeholder="AIza..." spellCheck={false} />
          <label style={lbl}>내 채널 ID</label>
          <input style={inp} value={ytChannelId} onChange={e => setYtChannelId(e.target.value)} placeholder="UCxxxxx..." spellCheck={false} />
          <p style={hint}>Google Cloud Console → YouTube Data API v3 → 사용 설정 → API 키 생성</p>
        </div>

        {/* ── Instagram ───────────────────────────────────── */}
        <div style={divider}>
          <div className="heading-en text-xl mb-3" style={{ color: '#0033FF' }}>INSTAGRAM</div>
          <label style={lbl}>Instagram Business Account ID</label>
          <input style={inp} value={igAccountId} onChange={e => setIgAccountId(e.target.value)} placeholder="17자리 숫자 ID 입력" spellCheck={false} />
          <label style={lbl}>User Access Token</label>
          <input style={inp} value={igToken} onChange={e => setIgToken(e.target.value)} placeholder="EAAv..." spellCheck={false} />
          <p style={hint}>Meta Developer Console → Graph API Explorer → instagram_business_account ID + EAAv... 토큰 필요</p>
        </div>

        {/* ── Gemini ──────────────────────────────────────── */}
        <div style={{ ...divider, paddingBottom: 8 }}>
          <div className="heading-en text-xl mb-3" style={{ color: '#FFEE00' }}>GEMINI AI</div>
          <label style={lbl}>Gemini API Key</label>
          <input style={inp} value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza..." spellCheck={false} />
          <p style={hint}>Google AI Studio (aistudio.google.com) → Get API Key → 무료 사용 가능</p>
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
            padding: '18px 20px',
            cursor: 'pointer',
            marginTop: 16,
          }}
        >
          저장 →
        </button>
      </div>
    </div>
  )
}
