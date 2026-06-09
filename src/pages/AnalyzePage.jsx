import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { analyzeContent, getWeeklyDirection, getAccountProfile } from '../services/gemini'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'

// ─── 공통 스타일 상수 ─────────────────────────────────────────────────────────
const S = {
  secLabel: {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '16px 16px 18px',
    marginBottom: 2,
    background: '#0D0D0D',
  },
  hint: {
    fontFamily: 'Pretendard',
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '-0.05em',
    lineHeight: 1.6,
    marginTop: 6,
  },
}

// ─── 탭 버튼 ──────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        fontFamily: 'Barlow Condensed',
        fontWeight: 800,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        background: active ? '#FFEE00' : 'transparent',
        color: active ? '#0A0A0A' : 'rgba(255,255,255,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '12px 6px',
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )
}

// ─── 계정 프로필 배너 ─────────────────────────────────────────────────────────
function ProfileBanner() {
  const navigate = useNavigate()
  const profile = getAccountProfile()
  const hasProfile = profile.concept || profile.target || profile.visual

  return (
    <div
      style={{
        border: `1px solid ${hasProfile ? 'rgba(255,238,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
        background: hasProfile ? 'rgba(255,238,0,0.04)' : '#111',
        padding: '12px 14px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
      }}
      onClick={() => navigate('/settings')}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
        {hasProfile ? '◈' : '○'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: hasProfile ? '#FFEE00' : 'rgba(255,255,255,0.3)', marginBottom: 3 }}>
          MY ACCOUNT PROFILE {hasProfile ? '· 설정됨' : '· 미설정'}
        </div>
        {hasProfile ? (
          <div style={{ fontFamily: 'Pretendard', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.05em', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.concept || profile.visual || profile.target}
          </div>
        ) : (
          <div style={{ fontFamily: 'Pretendard', fontSize: 13, color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.05em' }}>
            설정 탭에서 계정 프로필을 입력하면 맞춤 분석을 받을 수 있어요 →
          </div>
        )}
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 2 }}>편집</span>
    </div>
  )
}

// ─── 분석 결과 컴포넌트 ───────────────────────────────────────────────────────
function AnalysisResult({ result }) {
  if (result.raw) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.secLabel}>ANALYSIS RESULT</div>
          <p style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {result.raw}
          </p>
        </div>
      </div>
    )
  }

  const scoreColor = result.score >= 80 ? '#FFEE00' : result.score >= 60 ? '#F5F5F0' : '#FF5555'

  return (
    <div style={{ marginTop: 24 }}>
      {/* 점수 */}
      <div style={{ ...S.card, background: '#111' }}>
        <div style={S.secLabel}>OVERALL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontFamily: 'Pretendard', fontSize: 15, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.55, flex: 1 }}>
            {result.overall}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 40, fontWeight: 700, color: scoreColor, lineHeight: 1, flexShrink: 0 }}>
            {result.score}
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: '#1A1A1A', marginBottom: 2 }}>
        <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor }} />
      </div>

      {/* 계정 결 일치도 */}
      {result.fit && (
        <ResultCard label="ACCOUNT FIT">
          <p style={bodyText}>{result.fit}</p>
        </ResultCard>
      )}

      {/* 톤앤매너 */}
      {result.tone && (
        <ResultCard label="TONE & MANNER">
          <p style={bodyText}>{result.tone}</p>
        </ResultCard>
      )}

      {/* 강점 */}
      {result.strengths?.length > 0 && (
        <ResultCard label="STRENGTHS">
          {result.strengths.map((s, i) => <Bullet key={i} color="#FFEE00" text={s} />)}
        </ResultCard>
      )}

      {/* 개선점 */}
      {result.improvements?.length > 0 && (
        <ResultCard label="IMPROVEMENTS">
          {result.improvements.map((s, i) => <Bullet key={i} color="#0033FF" text={s} />)}
        </ResultCard>
      )}

      {/* 방향성 */}
      {result.direction && (
        <ResultCard label="DIRECTION">
          <p style={bodyText}>{result.direction}</p>
        </ResultCard>
      )}

      {/* 해시태그 */}
      {result.hashtags?.length > 0 && (
        <ResultCard label="HASHTAGS">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.hashtags.map((tag, i) => (
              <span key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#0A0A0A', background: '#F5F5F0', padding: '4px 10px' }}>
                {tag}
              </span>
            ))}
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ─── 주간 방향성 결과 컴포넌트 ───────────────────────────────────────────────
function WeeklyResult({ result }) {
  if (result.raw) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <p style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {result.raw}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* 총평 */}
      {result.summary && (
        <div style={{ ...S.card, background: '#111', marginBottom: 2 }}>
          <div style={S.secLabel}>THIS WEEK</div>
          <p style={{ ...bodyText, color: '#F5F5F0', fontSize: 15, margin: 0 }}>{result.summary}</p>
        </div>
      )}

      {/* 이번 주 테마 */}
      {result.weeklyTheme && (
        <div style={{ background: '#FFEE00', padding: '14px 16px', marginBottom: 2 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>WEEKLY THEME</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 22, color: '#0A0A0A', letterSpacing: '0.02em', lineHeight: 1.2 }}>
            {result.weeklyTheme}
          </div>
        </div>
      )}

      {/* 콘텐츠 아이디어 */}
      {result.contentIdeas?.length > 0 && (
        <ResultCard label="CONTENT IDEAS">
          {result.contentIdeas.map((idea, i) => (
            <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < result.contentIdeas.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#0A0A0A', background: '#FFEE00', padding: '2px 7px', flexShrink: 0 }}>{idea.type}</span>
              </div>
              <div style={{ fontFamily: 'Pretendard', fontSize: 14, color: '#F5F5F0', letterSpacing: '-0.05em', fontWeight: 600, marginBottom: 3 }}>{idea.title}</div>
              <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.05em', lineHeight: 1.5 }}>{idea.reason}</div>
            </div>
          ))}
        </ResultCard>
      )}

      {/* 톤앤매너 */}
      {result.toneAdvice && (
        <ResultCard label="TONE GUIDE">
          <p style={bodyText}>{result.toneAdvice}</p>
        </ResultCard>
      )}

      {/* 비주얼 컨셉 */}
      {result.visualConcept && (
        <ResultCard label="VISUAL CONCEPT">
          <p style={bodyText}>{result.visualConcept}</p>
        </ResultCard>
      )}

      {/* 할 것 / 피할 것 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
        {result.doThis?.length > 0 && (
          <div style={{ ...S.card, margin: 0 }}>
            <div style={{ ...S.secLabel, color: '#FFEE00' }}>DO THIS</div>
            {result.doThis.map((s, i) => <Bullet key={i} color="#FFEE00" text={s} small />)}
          </div>
        )}
        {result.avoidThis?.length > 0 && (
          <div style={{ ...S.card, margin: 0 }}>
            <div style={{ ...S.secLabel, color: '#FF5555' }}>AVOID</div>
            {result.avoidThis.map((s, i) => <Bullet key={i} color="#FF5555" text={s} small />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 유틸 서브컴포넌트 ───────────────────────────────────────────────────────
const bodyText = { fontFamily: 'Pretendard', fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.05em', lineHeight: 1.7, margin: 0 }

function ResultCard({ label, children }) {
  return (
    <div style={{ ...S.card, marginBottom: 2 }}>
      <div style={S.secLabel}>{label}</div>
      {children}
    </div>
  )
}

function Bullet({ color, text, small }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: small ? 6 : 8 }}>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: small ? 10 : 12, color, flexShrink: 0, paddingTop: 2 }}>▸</span>
      <span style={{ fontFamily: 'Pretendard', fontSize: small ? 12 : 14, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

// ─── 텍스트에어리어 공통 스타일 ──────────────────────────────────────────────
const textareaStyle = {
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

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [tab, setTab]           = useState('weekly')  // 'weekly' | 'reference'
  const [toast, setToast]       = useState(null)

  // 레퍼런스 분석 상태
  const [videoFile, setVideoFile]   = useState(null)
  const [textInput, setTextInput]   = useState('')
  const [dragging, setDragging]     = useState(false)
  const [refLoading, setRefLoading] = useState(false)
  const [refProgress, setRefProgress] = useState('')
  const [refResult, setRefResult]   = useState(null)
  const fileInputRef = useRef()

  // 주간 방향성 상태
  const [weekLoading, setWeekLoading]   = useState(false)
  const [weekProgress, setWeekProgress] = useState('')
  const [weekResult, setWeekResult]     = useState(null)

  const hasKey = !!localStorage.getItem('gemini_api_key')

  // ── 레퍼런스 분석 ────────────────────────────────────────────────────────
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
    setRefResult(null)
  }

  async function runReference() {
    if (!hasKey) { setToast({ message: '설정에서 Gemini API 키를 먼저 입력해줘요', type: 'error' }); return }
    if (!videoFile && !textInput.trim()) return
    setRefLoading(true)
    setRefResult(null)
    try {
      const data = await analyzeContent({ videoFile, textInput, onProgress: setRefProgress })
      setRefResult(data)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
    setRefLoading(false)
    setRefProgress('')
  }

  // ── 주간 방향성 ──────────────────────────────────────────────────────────
  async function runWeekly() {
    if (!hasKey) { setToast({ message: '설정에서 Gemini API 키를 먼저 입력해줘요', type: 'error' }); return }
    setWeekLoading(true)
    setWeekResult(null)
    setWeekProgress('인스타그램 데이터 불러오는 중...')

    let igProfile = null
    let recentMedia = []

    try {
      igProfile = await fetchIGProfile()
    } catch (_) { /* 토큰 없어도 계속 진행 */ }

    try {
      recentMedia = await fetchIGMedia(10)
    } catch (_) {}

    try {
      const data = await getWeeklyDirection({ igProfile, recentMedia, onProgress: setWeekProgress })
      setWeekResult(data)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
    setWeekLoading(false)
    setWeekProgress('')
  }

  const hasRefInput = videoFile || textInput.trim()

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="ANALYZE" ko="콘텐츠 분석" />

      <div className="px-5 pt-3" style={{ paddingBottom: 100 }}>

        {/* 계정 프로필 배너 */}
        <ProfileBanner />

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
          <TabBtn label="이번 주 방향성" active={tab === 'weekly'}    onClick={() => setTab('weekly')} />
          <TabBtn label="레퍼런스 분석"  active={tab === 'reference'} onClick={() => setTab('reference')} />
        </div>

        {/* ── 주간 방향성 탭 ──────────────────────────────────── */}
        {tab === 'weekly' && (
          <div>
            <div style={S.secLabel}>WEEKLY BRANDING DIRECTION</div>
            <p style={{ ...S.hint, marginBottom: 20 }}>
              최근 인스타그램 게시물 데이터와 내 계정 프로필을 바탕으로,<br />
              이번 주 올릴 콘텐츠의 방향성을 Gemini가 제안해줘요.
            </p>

            <button
              onClick={runWeekly}
              disabled={weekLoading}
              style={{
                width: '100%',
                background: weekLoading ? '#1A1A1A' : '#FFEE00',
                color: weekLoading ? 'rgba(255,255,255,0.2)' : '#0A0A0A',
                fontFamily: 'Barlow Condensed',
                fontWeight: 800,
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: 'none',
                padding: '18px 20px',
                cursor: weekLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {weekLoading ? (weekProgress || '분석 중...') : '이번 주 방향성 제안받기 →'}
            </button>

            {!hasKey && (
              <p style={{ ...S.hint, marginTop: 8 }}>설정(⚙)에서 Gemini API 키를 먼저 입력해주세요</p>
            )}

            {weekResult && <WeeklyResult result={weekResult} />}
          </div>
        )}

        {/* ── 레퍼런스 분석 탭 ─────────────────────────────────── */}
        {tab === 'reference' && (
          <div>
            {/* 영상 업로드 */}
            <div style={{ marginBottom: 16 }}>
              <div style={S.secLabel}>VIDEO UPLOAD</div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onFileDrop}
                style={{
                  border: `1px solid ${dragging ? '#FFEE00' : 'rgba(255,255,255,0.12)'}`,
                  background: dragging ? 'rgba(255,238,0,0.04)' : '#0D0D0D',
                  padding: '24px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.12s',
                }}
              >
                {videoFile ? (
                  <div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#FFEE00', marginBottom: 3 }}>▶ {videoFile.name}</div>
                    <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.05em' }}>
                      {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>▣</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
                      DRAG & DROP OR TAP
                    </div>
                    <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.05em' }}>
                      릴스·쇼츠·틱톡 .mp4 .mov
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onFileDrop} />
              {videoFile && (
                <button onClick={() => { setVideoFile(null); setRefResult(null) }} style={{ marginTop: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 12px', cursor: 'pointer' }}>
                  ✕ 제거
                </button>
              )}
            </div>

            {/* 텍스트 입력 */}
            <div style={{ marginBottom: 16 }}>
              <div style={S.secLabel}>CONCEPT / CAPTION</div>
              <textarea
                style={{ ...textareaStyle, minHeight: 100 }}
                value={textInput}
                onChange={e => { setTextInput(e.target.value); setRefResult(null) }}
                placeholder={'영상 컨셉, 캡션, 해시태그, 참고 계정 방향성 등 자유롭게 적어줘요.\n영상 없이 텍스트만으로도 분석 가능해요.'}
              />
            </div>

            {/* 분석 버튼 */}
            <button
              onClick={runReference}
              disabled={refLoading || !hasRefInput}
              style={{
                width: '100%',
                background: hasRefInput && !refLoading ? '#FFEE00' : '#1A1A1A',
                color: hasRefInput && !refLoading ? '#0A0A0A' : 'rgba(255,255,255,0.2)',
                fontFamily: 'Barlow Condensed',
                fontWeight: 800,
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: 'none',
                padding: '18px 20px',
                cursor: hasRefInput && !refLoading ? 'pointer' : 'not-allowed',
              }}
            >
              {refLoading ? (refProgress || '분석 중...') : 'ANALYZE →'}
            </button>

            {!hasKey && (
              <p style={{ ...S.hint, marginTop: 8 }}>설정(⚙)에서 Gemini API 키를 먼저 입력해주세요</p>
            )}

            {refResult && <AnalysisResult result={refResult} />}
          </div>
        )}
      </div>
    </div>
  )
}
