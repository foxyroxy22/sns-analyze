import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import {
  analyzeContent,
  getWeeklyRoutine,
  getAccountProfile,
  getConfirmedRefs,
  saveConfirmedRefs,
} from '../services/gemini'
import { fetchIGProfile, fetchIGMedia } from '../services/instagram'

// ─── 공통 스타일 ─────────────────────────────────────────────────────────────
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
    padding: '14px 16px 16px',
    marginBottom: 2,
    background: '#0D0D0D',
  },
  hint: {
    fontFamily: 'Pretendard',
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '-0.05em',
    lineHeight: 1.6,
  },
}

const bodyTxt = {
  fontFamily: 'Pretendard',
  fontSize: 14,
  color: 'rgba(255,255,255,0.72)',
  letterSpacing: '-0.05em',
  lineHeight: 1.72,
  margin: 0,
}

const DAY_COLORS = {
  월: '#FFEE00', 화: '#0033FF', 수: '#FFEE00', 목: '#0033FF',
  금: '#FFEE00', 토: '#F5F5F0', 일: '#F5F5F0',
}

const TYPE_ICONS = {
  릴스: '▶', 비주얼캐러셀: '◼', 스토리: '◎', 피드: '◻', 휴식: '○',
}

// ─── 탭 버튼 ─────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        fontFamily: 'Barlow Condensed',
        fontWeight: 800,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: active ? '#FFEE00' : 'transparent',
        color: active ? '#0A0A0A' : 'rgba(255,255,255,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '10px 4px',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}

// ─── 계정 프로필 배너 ─────────────────────────────────────────────────────────
function ProfileBanner() {
  const navigate  = useNavigate()
  const profile   = getAccountProfile()
  const hasProfile = !!(profile.concept || profile.target || profile.visual)

  return (
    <div
      onClick={() => navigate('/settings')}
      style={{
        border: `1px solid ${hasProfile ? 'rgba(255,238,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
        background: hasProfile ? 'rgba(255,238,0,0.04)' : '#111',
        padding: '11px 14px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{hasProfile ? '◈' : '○'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: hasProfile ? '#FFEE00' : 'rgba(255,255,255,0.3)', marginBottom: 3 }}>
          MY ACCOUNT PROFILE {hasProfile ? '· 설정됨' : '· 미설정'}
        </div>
        <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: hasProfile ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', letterSpacing: '-0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasProfile ? (profile.concept || profile.visual || profile.target) : '설정에서 계정 프로필을 입력하면 맞춤 분석을 받을 수 있어요 →'}
        </div>
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>편집</span>
    </div>
  )
}

// ─── 컨펌된 레퍼런스 보관함 ───────────────────────────────────────────────────
function ReferenceVault({ refs, onChange }) {
  const [memo,  setMemo]  = useState('')
  const [url,   setUrl]   = useState('')
  const [open,  setOpen]  = useState(false)

  function addRef() {
    if (!memo.trim() && !url.trim()) return
    const next = [
      ...refs,
      { id: Date.now(), memo: memo.trim(), url: url.trim(), date: new Date().toLocaleDateString('ko-KR') },
    ]
    saveConfirmedRefs(next)
    onChange(next)
    setMemo('')
    setUrl('')
    setOpen(false)
  }

  function removeRef(id) {
    const next = refs.filter(r => r.id !== id)
    saveConfirmedRefs(next)
    onChange(next)
  }

  const inp = {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#F5F5F0',
    fontFamily: 'Pretendard',
    fontSize: 13,
    padding: '10px 12px',
    outline: 'none',
    letterSpacing: '-0.05em',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ ...S.secLabel, marginBottom: 0 }}>
          CONFIRMED REFERENCES
          {refs.length > 0 && (
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#FFEE00', marginLeft: 8 }}>
              {refs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            fontFamily: 'Barlow Condensed',
            fontWeight: 700,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: open ? '#FFEE00' : 'transparent',
            color: open ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          {open ? '접기' : '+ 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {open && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', marginBottom: 8 }}>
          <div style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.05em', marginBottom: 8 }}>
            힙하다고 느낀 레퍼런스, 비주얼 무드, 아이디어를 저장해요
          </div>
          <textarea
            style={{ ...inp, resize: 'none', minHeight: 64, lineHeight: 1.55 }}
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="예: 비비드 컬러 + 별 오브제 활용한 캐러셀. 텍스처 강조, Y2K 무드"
          />
          <input
            style={inp}
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="레퍼런스 링크 (선택)"
            type="url"
          />
          <button
            onClick={addRef}
            disabled={!memo.trim() && !url.trim()}
            style={{
              width: '100%',
              background: (memo.trim() || url.trim()) ? '#FFEE00' : '#222',
              color: (memo.trim() || url.trim()) ? '#0A0A0A' : 'rgba(255,255,255,0.2)',
              fontFamily: 'Barlow Condensed',
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: 'none',
              padding: '11px',
              cursor: (memo.trim() || url.trim()) ? 'pointer' : 'not-allowed',
            }}
          >
            CONFIRM & SAVE →
          </button>
        </div>
      )}

      {/* 저장된 레퍼런스 목록 */}
      {refs.length === 0 ? (
        <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '18px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.05em', lineHeight: 1.6 }}>
            컨펌된 레퍼런스가 없어요<br />
            힙하다 싶은 비주얼·아이디어를 저장하면<br />
            루틴 생성에 반영돼요
          </div>
        </div>
      ) : (
        <div>
          {refs.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '10px 0',
              }}
            >
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#FFEE00', flexShrink: 0, paddingTop: 3 }}>✓</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {r.memo && (
                  <p style={{ fontFamily: 'Pretendard', fontSize: 13, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.55, margin: '0 0 3px' }}>
                    {r.memo}
                  </p>
                )}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#0033FF', wordBreak: 'break-all' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {r.url}
                  </a>
                )}
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{r.date}</div>
              </div>
              <button
                onClick={() => removeRef(r.id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 14, cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 루틴 결과 카드 ───────────────────────────────────────────────────────────
function RoutineResult({ result }) {
  if (result.raw) {
    return (
      <div style={{ ...S.card, marginTop: 24 }}>
        <p style={bodyTxt}>{result.raw}</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* 총평 */}
      {result.weekSummary && (
        <div style={{ ...S.card, background: '#111', marginBottom: 2 }}>
          <div style={S.secLabel}>THIS WEEK</div>
          <p style={{ ...bodyTxt, color: '#F5F5F0', fontSize: 15 }}>{result.weekSummary}</p>
        </div>
      )}

      {/* 테마 배너 */}
      {result.weekTheme && (
        <div style={{ background: '#FFEE00', padding: '14px 16px', marginBottom: 2 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>WEEKLY THEME</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 20, color: '#0A0A0A', lineHeight: 1.2 }}>
            {result.weekTheme}
          </div>
        </div>
      )}

      {/* 요일 카드 */}
      {result.routine?.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <div style={{ ...S.secLabel, marginTop: 12, marginBottom: 8 }}>WEEKLY ROUTINE</div>
          {result.routine.map((r, i) => {
            const isRest    = r.type === '휴식'
            const isReels   = r.type === '릴스'
            const isCarousel = r.type === '비주얼캐러셀'
            const dayColor  = isRest ? 'rgba(255,255,255,0.15)' : DAY_COLORS[r.day] || '#F5F5F0'
            const typeIcon  = TYPE_ICONS[r.type] || '◇'

            return (
              <div
                key={i}
                style={{
                  marginBottom: 2,
                  border: isCarousel
                    ? '1px solid rgba(255,238,0,0.35)'
                    : `1px solid ${isRest ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                  background: isCarousel ? 'rgba(255,238,0,0.04)' : isRest ? '#0A0A0A' : '#0D0D0D',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex' }}>
                  {/* 요일 컬럼 */}
                  <div style={{
                    width: 44,
                    flexShrink: 0,
                    background: isRest ? 'transparent' : dayColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 0',
                  }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 18, color: isRest ? 'rgba(255,255,255,0.15)' : '#0A0A0A', lineHeight: 1 }}>{r.day}</span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: isRest ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.45)', marginTop: 3 }}>{typeIcon}</span>
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: 'IBM Plex Mono',
                        fontSize: 9,
                        color: isCarousel ? '#0A0A0A' : isRest ? 'rgba(255,255,255,0.2)' : dayColor,
                        background: isCarousel ? '#FFEE00' : isRest ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)',
                        padding: '2px 7px',
                      }}>
                        {r.type}
                      </span>
                      {isCarousel && (
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#FFEE00' }}>★ 비주얼 피드</span>
                      )}
                    </div>

                    <p style={{ fontFamily: 'Pretendard', fontSize: 13, color: isRest ? 'rgba(255,255,255,0.25)' : '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.55, margin: '0 0 6px' }}>
                      {r.action}
                    </p>

                    {/* 릴스: 화면 / 자막 분리 */}
                    {isReels && (r.screen || r.caption) && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 4 }}>
                        {r.screen && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>
                              📷 화면 소스
                            </div>
                            <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.05em', lineHeight: 1.5, margin: 0 }}>
                              {r.screen}
                            </p>
                          </div>
                        )}
                        {r.caption && (
                          <div>
                            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FFEE00', marginBottom: 3 }}>
                              💬 자막 / 나레이션
                            </div>
                            <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: '#FFEE00', letterSpacing: '-0.05em', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                              "{r.caption}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 비주얼캐러셀: 레퍼런스 매칭 */}
                    {isCarousel && r.refMatch && (
                      <div style={{ borderTop: '1px solid rgba(255,238,0,0.15)', paddingTop: 8, marginTop: 4 }}>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,238,0,0.6)', marginBottom: 3 }}>
                          ◈ 레퍼런스 매칭
                        </div>
                        <p style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,238,0,0.8)', letterSpacing: '-0.05em', lineHeight: 1.5, margin: 0 }}>
                          {r.refMatch}
                        </p>
                      </div>
                    )}

                    {/* 팁 */}
                    {r.tip && (
                      <p style={{ fontFamily: 'Pretendard', fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: '-0.05em', lineHeight: 1.5, margin: '6px 0 0' }}>
                        💡 {r.tip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MUST DO / AVOID */}
      {(result.mustDo?.length > 0 || result.mustAvoid?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginTop: 2 }}>
          {result.mustDo?.length > 0 && (
            <RCard label="MUST DO" accent="#FFEE00">
              {result.mustDo.map((s, i) => <Bullet key={i} color="#FFEE00" text={s} />)}
            </RCard>
          )}
          {result.mustAvoid?.length > 0 && (
            <RCard label="AVOID" accent="#FF5555">
              {result.mustAvoid.map((s, i) => <Bullet key={i} color="#FF5555" text={s} />)}
            </RCard>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 레퍼런스 분석 결과 ───────────────────────────────────────────────────────
function RefResult({ result }) {
  if (result.raw) return <div style={{ ...S.card, marginTop: 24 }}><p style={bodyTxt}>{result.raw}</p></div>

  const scoreColor = result.score >= 80 ? '#FFEE00' : result.score >= 60 ? '#F5F5F0' : '#FF5555'

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ ...S.card, background: '#111' }}>
        <div style={S.secLabel}>OVERALL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <p style={{ ...bodyTxt, color: '#F5F5F0', fontSize: 15, flex: 1 }}>{result.overall}</p>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 40, fontWeight: 700, color: scoreColor, lineHeight: 1, flexShrink: 0 }}>{result.score}</div>
        </div>
      </div>
      <div style={{ height: 3, background: '#1A1A1A', marginBottom: 2 }}>
        <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor }} />
      </div>

      {result.fit        && <RCard label="ACCOUNT FIT"   ><p style={bodyTxt}>{result.fit}</p></RCard>}
      {result.tone       && <RCard label="TONE & MANNER"  ><p style={bodyTxt}>{result.tone}</p></RCard>}
      {result.strengths?.length    > 0 && <RCard label="STRENGTHS"   >{result.strengths.map((s, i)    => <Bullet key={i} color="#FFEE00" text={s} />)}</RCard>}
      {result.improvements?.length > 0 && <RCard label="IMPROVEMENTS">{result.improvements.map((s, i) => <Bullet key={i} color="#0033FF" text={s} />)}</RCard>}
      {result.direction  && <RCard label="DIRECTION"><p style={bodyTxt}>{result.direction}</p></RCard>}
      {result.hashtags?.length > 0 && (
        <RCard label="HASHTAGS">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.hashtags.map((tag, i) => (
              <span key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#0A0A0A', background: '#F5F5F0', padding: '4px 10px' }}>{tag}</span>
            ))}
          </div>
        </RCard>
      )}
    </div>
  )
}

// ─── 유틸 컴포넌트 ────────────────────────────────────────────────────────────
function RCard({ label, accent, children }) {
  return (
    <div style={{ ...S.card, marginBottom: 2 }}>
      <div style={{ ...S.secLabel, ...(accent ? { color: accent } : {}) }}>{label}</div>
      {children}
    </div>
  )
}

function Bullet({ color, text }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color, flexShrink: 0, paddingTop: 2 }}>▸</span>
      <span style={{ fontFamily: 'Pretendard', fontSize: 13, color: '#F5F5F0', letterSpacing: '-0.05em', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

function BigBtn({ onClick, disabled, loading, progress, label }) {
  const active = !disabled && !loading
  return (
    <button
      onClick={onClick}
      disabled={!active}
      style={{
        width: '100%',
        background: active ? '#FFEE00' : '#1A1A1A',
        color: active ? '#0A0A0A' : 'rgba(255,255,255,0.18)',
        fontFamily: 'Barlow Condensed',
        fontWeight: 800,
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: 'none',
        padding: '18px 20px',
        cursor: active ? 'pointer' : 'not-allowed',
      }}
    >
      {loading ? (progress || '생성 중...') : label}
    </button>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [tab, setTab] = useState('routine')
  const [toast, setToast] = useState(null)

  // 레퍼런스 보관함 상태
  const [refs, setRefs] = useState(() => getConfirmedRefs())

  // 루틴 상태
  const [routineLoading,  setRoutineLoading]  = useState(false)
  const [routineProgress, setRoutineProgress] = useState('')
  const [routineResult,   setRoutineResult]   = useState(null)

  // 레퍼런스 분석 상태
  const [videoFile,   setVideoFile]   = useState(null)
  const [textInput,   setTextInput]   = useState('')
  const [dragging,    setDragging]    = useState(false)
  const [refLoading,  setRefLoading]  = useState(false)
  const [refProgress, setRefProgress] = useState('')
  const [refResult,   setRefResult]   = useState(null)
  const fileInputRef = useRef()

  const hasKey = !!localStorage.getItem('gemini_api_key')

  // ── 루틴 생성 ────────────────────────────────────────────────────────────
  async function runRoutine() {
    if (!hasKey) { setToast({ message: '설정에서 Gemini API 키를 먼저 입력해줘요', type: 'error' }); return }
    setRoutineLoading(true)
    setRoutineResult(null)
    setRoutineProgress('인스타그램 데이터 불러오는 중...')

    let igProfile = null, recentMedia = []
    try { igProfile   = await fetchIGProfile() } catch (_) {}
    try { recentMedia = await fetchIGMedia(10) } catch (_) {}

    try {
      const data = await getWeeklyRoutine({
        igProfile,
        recentMedia,
        confirmedRefs: refs,
        onProgress: setRoutineProgress,
      })
      setRoutineResult(data)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
    setRoutineLoading(false)
    setRoutineProgress('')
  }

  // ── 레퍼런스 분석 ────────────────────────────────────────────────────────
  function onFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setToast({ message: '영상 파일(.mp4, .mov 등)만 업로드 가능해요', type: 'error' }); return
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

  const hasRefInput = !!(videoFile || textInput.trim())

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

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader en="ANALYZE" ko="콘텐츠 분석" />

      <div className="px-5 pt-3" style={{ paddingBottom: 100 }}>
        <ProfileBanner />

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
          <TabBtn label="루틴 생성"     active={tab === 'routine'}   onClick={() => setTab('routine')} />
          <TabBtn label="레퍼런스 분석" active={tab === 'reference'} onClick={() => setTab('reference')} />
        </div>

        {/* ── 루틴 생성 탭 ─────────────────────────────────────── */}
        {tab === 'routine' && (
          <div>
            {/* 레퍼런스 보관함 */}
            <ReferenceVault refs={refs} onChange={setRefs} />

            <div style={{ ...S.secLabel, marginBottom: 6 }}>WEEKLY BRANDING ROUTINE</div>
            <p style={{ ...S.hint, marginBottom: 16 }}>
              인스타 데이터 + 컨펌 레퍼런스를 기반으로 이번 주<br />
              월~일 요일별 실행 루틴을 생성해요.
            </p>

            <BigBtn
              onClick={runRoutine}
              loading={routineLoading}
              progress={routineProgress}
              label="이번 주 브랜딩 루틴 생성하기 →"
            />

            {!hasKey && <p style={{ ...S.hint, marginTop: 8 }}>설정(⚙)에서 Gemini API 키를 먼저 입력해주세요</p>}

            {routineResult && <RoutineResult result={routineResult} />}
          </div>
        )}

        {/* ── 레퍼런스 분석 탭 ──────────────────────────────────── */}
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
                  transition: 'border-color 0.1s',
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
                    <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.3 }}>▣</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>DRAG & DROP OR TAP</div>
                    <div style={{ fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.05em' }}>릴스·쇼츠·틱톡 .mp4 .mov</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onFileDrop} />
              {videoFile && (
                <button
                  onClick={() => { setVideoFile(null); setRefResult(null) }}
                  style={{ marginTop: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 12px', cursor: 'pointer' }}
                >
                  ✕ 제거
                </button>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={S.secLabel}>CONCEPT / CAPTION</div>
              <textarea
                style={{ ...textareaStyle, minHeight: 100 }}
                value={textInput}
                onChange={e => { setTextInput(e.target.value); setRefResult(null) }}
                placeholder={'영상 컨셉, 캡션, 해시태그 등 자유롭게 적어줘요.\n영상 없이 텍스트만으로도 분석 가능해요.'}
              />
            </div>

            <BigBtn
              onClick={runReference}
              disabled={!hasRefInput}
              loading={refLoading}
              progress={refProgress}
              label="ANALYZE →"
            />

            {!hasKey && <p style={{ ...S.hint, marginTop: 8 }}>설정(⚙)에서 Gemini API 키를 먼저 입력해주세요</p>}
            {refResult && <RefResult result={refResult} />}
          </div>
        )}
      </div>
    </div>
  )
}
