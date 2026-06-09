import { useState, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { analyzeContent } from '../services/gemini'

export default function AnalyzePage() {
  const [videoFile, setVideoFile]   = useState(null)
  const [textInput, setTextInput]   = useState('')
  const [dragging, setDragging]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [progress, setProgress]     = useState('')
  const [result, setResult]         = useState(null)
  const [toast, setToast]           = useState(null)
  const fileInputRef = useRef()

  const hasInput = videoFile || textInput.trim()
  const hasKey   = !!localStorage.getItem('gemini_api_key')

  function onFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setToast({ message: '영상 파일(.mp4, .mov 등)만 업로드 가능해요', type: 'error' })
      return
    }
    setVideoFile(file)
    setResult(null)
  }

  async function analyze() {
    if (!hasKey) {
      setToast({ message: '설정에서 Gemini API 키를 먼저 입력해줘요', type: 'error' })
      return
    }
    if (!hasInput) return

    setLoading(true)
    setResult(null)
    setProgress('')

    try {
      const data = await analyzeContent({
        videoFile,
        textInput,
        onProgress: setProgress,
      })
      setResult(data)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
    setLoading(false)
    setProgress('')
  }

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#F5F5F0',
    fontFamily: 'Pretendard',
    fontSize: 14,
    padding: '12px 14px',
    outline: 'none',
    letterSpacing: '-0.05em',
    lineHeight: 1.6,
    resize: 'none',
    display: 'block',
  }

  const sectionLabel = {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="ANALYZE" ko="콘텐츠 분석" />

      <div className="px-5 pt-4" style={{ paddingBottom: 100 }}>

        {/* 영상 업로드 */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionLabel}>VIDEO UPLOAD</div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onFileDrop}
            style={{
              border: `1px solid ${dragging ? '#FFEE00' : 'rgba(255,255,255,0.15)'}`,
              background: dragging ? 'rgba(255,238,0,0.05)' : '#111',
              padding: '28px 20px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.15s',
            }}
          >
            {videoFile ? (
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#FFEE00', marginBottom: 4 }}>
                  ▶ {videoFile.name}
                </div>
                <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em' }}>
                  {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>▣</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  DRAG & DROP OR TAP
                </div>
                <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.05em' }}>
                  릴스, 쇼츠, 틱톡 영상 .mp4 .mov
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={onFileDrop}
          />

          {videoFile && (
            <button
              onClick={() => { setVideoFile(null); setResult(null) }}
              style={{
                marginTop: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Barlow Condensed',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              ✕ 제거
            </button>
          )}
        </div>

        {/* 텍스트 입력 */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionLabel}>CONCEPT / CAPTION</div>
          <textarea
            style={{ ...inputStyle, minHeight: 120 }}
            value={textInput}
            onChange={e => { setTextInput(e.target.value); setResult(null) }}
            placeholder="영상 컨셉, 캡션, 해시태그, 계정 방향성 등을 자유롭게 적어줘요.&#10;영상 없이 텍스트만으로도 분석 가능해요."
          />
        </div>

        {/* 분석하기 버튼 */}
        <button
          onClick={analyze}
          disabled={loading || !hasInput}
          style={{
            width: '100%',
            background: hasInput && !loading ? '#FFEE00' : '#222',
            color: hasInput && !loading ? '#0A0A0A' : 'rgba(255,255,255,0.2)',
            fontFamily: 'Barlow Condensed',
            fontWeight: 800,
            fontSize: 22,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            padding: '18px 20px',
            cursor: hasInput && !loading ? 'pointer' : 'not-allowed',
            marginBottom: 4,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {loading ? progress || '분석 중...' : 'ANALYZE →'}
        </button>

        {!hasKey && (
          <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.05em', marginTop: 6 }}>
            설정(⚙)에서 Gemini API 키를 먼저 입력해주세요
          </div>
        )}

        {/* 결과 */}
        {result && (
          <AnalysisResult result={result} />
        )}
      </div>
    </div>
  )
}

function AnalysisResult({ result }) {
  if (result.raw) {
    return (
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>ANALYSIS RESULT</div>
        <div style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.7, whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
          {result.raw}
        </div>
      </div>
    )
  }

  const scoreColor = result.score >= 80 ? '#FFEE00' : result.score >= 60 ? '#F5F5F0' : '#FF4444'

  return (
    <div style={{ marginTop: 28 }}>

      {/* 전체 평가 + 점수 */}
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 20, marginBottom: 2, background: '#111' }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>OVERALL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontFamily: 'Pretendard', fontSize: 15, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.5, flex: 1 }}>
            {result.overall}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 36, fontWeight: 700, color: scoreColor, lineHeight: 1, flexShrink: 0 }}>
            {result.score}
          </div>
        </div>
      </div>

      {/* 점수 바 */}
      <div style={{ height: 4, background: '#1A1A1A', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor, transition: 'width 0.6s ease' }} />
      </div>

      {/* 톤앤매너 */}
      {result.tone && (
        <Section label="TONE & MANNER" accent="rgba(255,255,255,0.7)">
          <p style={{ fontFamily: 'Pretendard', fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.05em', lineHeight: 1.7, margin: 0 }}>
            {result.tone}
          </p>
        </Section>
      )}

      {/* 강점 */}
      {result.strengths?.length > 0 && (
        <Section label="STRENGTHS" accent="#FFEE00">
          {result.strengths.map((s, i) => (
            <Row key={i} color="#FFEE00" text={s} />
          ))}
        </Section>
      )}

      {/* 개선점 */}
      {result.improvements?.length > 0 && (
        <Section label="IMPROVEMENTS" accent="#0033FF">
          {result.improvements.map((s, i) => (
            <Row key={i} color="#0033FF" text={s} />
          ))}
        </Section>
      )}

      {/* 방향성 */}
      {result.direction && (
        <Section label="BRANDING DIRECTION" accent="#FFEE00">
          <p style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.7, margin: 0 }}>
            {result.direction}
          </p>
        </Section>
      )}

      {/* 해시태그 */}
      {result.hashtags?.length > 0 && (
        <Section label="RECOMMENDED HASHTAGS" accent="rgba(255,255,255,0.4)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.hashtags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  color: '#0A0A0A',
                  background: '#F5F5F0',
                  padding: '4px 10px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '16px 16px 18px', marginBottom: 2, background: '#0D0D0D' }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({ color, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color, flexShrink: 0, paddingTop: 2 }}>▸</span>
      <span style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}
